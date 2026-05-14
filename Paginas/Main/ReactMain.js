const { createRoot } = ReactDOM;
const { useEffect, useMemo, useState } = React;

const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';
const LOCAL_API_ORIGIN = 'http://localhost:3000';
const STORAGE_USER_KEY = 'silkpets:user';

function resolveApiBaseUrl2() {
	const { protocol, hostname, port } = window.location;

	if (protocol === 'file:') {
		return LOCAL_API_ORIGIN;
	}

	const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

	if (isLocalHost && port && port !== '3000') {
		return LOCAL_API_ORIGIN;
	}

	return '';
}

const apiBaseUrl2 = resolveApiBaseUrl2();

function readStoredUser() {
	try {
		const storedUser = localStorage.getItem(STORAGE_USER_KEY);
		return storedUser ? JSON.parse(storedUser) : null;
	} catch (_error) {
		localStorage.removeItem(STORAGE_USER_KEY);
		return null;
	}
}

function buildPetsRequestUrl() {
	const currentUser = readStoredUser();
	const ownerId = currentUser?.id ? encodeURIComponent(currentUser.id) : '';

	return ownerId ? `${apiBaseUrl2}/api/pets?ownerId=${ownerId}` : `${apiBaseUrl2}/api/pets`;
}

function createPetActions(pet) {
	return [
		{ label: 'Vacinas', href: `../vacinas/vacinas.html?pet=${encodeURIComponent(pet.id)}` },
		{ label: 'Consultas', href: '../consultas/consultas.html' },
	];
}

function normalizePet(pet) {
	return {
		id: pet.id || `pet-${pet.nome || 'sem-nome'}`,
		name: pet.nome || 'Pet sem nome',
		image: pet.imagem || DEFAULT_PET_IMAGE,
		alt: pet.nome ? `Foto de ${pet.nome}` : 'Foto do pet',
		info: [
			`Idade: ${pet.idade || 'Nao informada'}`,
			`Exames: ${pet.exames || 'Nao informado'}`,
			`Veterinario: ${pet.veterinario || 'Nao informado'}`,
			`Vacinas: ${pet.vacinas || 'Nao informado'}`,
			`Descricao: ${pet.descricao || 'Sem descricao cadastrada.'}`,
		],
		actions: createPetActions(pet),
	};
}

function PetCard({ pet }) {
	return (
		<article className="pet-card" id={pet.id}>
			<div className="pet-card__left">
				<div className="pet-media">
					<img src={pet.image} alt={pet.alt} loading="lazy" />
				</div>
				<h2 className="pet-name">{pet.name}</h2>
			</div>

			<div className="pet-card__right">
				<ul className="pet-info">
					{pet.info.map((item) => (
						<li key={`${pet.id}-${item}`}>{item}</li>
					))}
				</ul>

				<div className="pet-actions">
					{pet.actions.map((action) => (
						<a className="btn btn--ghost" href={action.href} key={`${pet.id}-${action.label}`}>
							{action.label}
						</a>
					))}
				</div>
			</div>
		</article>
	);
}

function EmptyState({ title, description }) {
	return (
		<article className="pet-card">
			<div className="pet-card__left">
				<div className="pet-media">
					<img src={DEFAULT_PET_IMAGE} alt={title} loading="lazy" />
				</div>
				<h2 className="pet-name">{title}</h2>
			</div>

			<div className="pet-card__right">
				<ul className="pet-info">
					<li>{description}</li>
				</ul>
			</div>
		</article>
	);
}

function PetCardsApp({ searchInput }) {
	console.log("PetsCardsApp()")
	const [pets, setPets] = useState([]);
	const [fetchStatus, setFetchStatus] = useState('loading');
	const [fetchError, setFetchError] = useState('');
	const [searchTerm, setSearchTerm] = useState(searchInput?.value || '');

	useEffect(() => {
		let shouldUpdate = true;

		async function loadPets() {
			setFetchStatus('loading');
			
			try {
				const url = buildPetsRequestUrl();
				console.log('[SilkPets] loadPets ->', url);
				const response = await fetch(url, {
					cache: 'no-store',
					credentials: 'include',
				});
				const contentType = response.headers.get('content-type') || '';
				const data = contentType.includes('application/json') ? await response.json() : {};

				console.log('[SilkPets] loadPets response:', response.status, data);

				if (!response.ok) {
					throw new Error(data.message || 'Nao foi possivel carregar os pets.');
				}

				if (!shouldUpdate) {
					return;
				}

				setPets(Array.isArray(data.pets) ? data.pets.map(normalizePet) : []);
				setFetchError('');
				setFetchStatus('ready');
			} catch (error) {
				console.error('[SilkPets] loadPets error:', error);
				if (!shouldUpdate) {
					return;
				}

				setFetchError(error.message || 'Nao foi possivel carregar os pets. Verifique se o servidor esta rodando.');
				setFetchStatus('error');
			}
		}

		function handlePetsChanged(event) {
			const newPet = event.detail?.newPet;
			if (newPet) {
				console.log('[SilkPets] pet added via event:', newPet);
				setPets(prev => [...prev, normalizePet(newPet)]);
				setFetchError('');
				setFetchStatus('ready');
			} else {
				loadPets();
			}
		}

		function handleUserChanged() {
			loadPets();
		}

		loadPets();
		window.addEventListener('pets:changed', handlePetsChanged);
		window.addEventListener('user:changed', handleUserChanged);

		return () => {
			shouldUpdate = false;
			window.removeEventListener('pets:changed', handlePetsChanged);
			window.removeEventListener('user:changed', handleUserChanged);
		};
	}, []);

	useEffect(() => {
		if (!searchInput) {
			return undefined;
		}

		function handleInput(event) {
			setSearchTerm(event.target.value);
		}

		searchInput.addEventListener('input', handleInput);

		return () => {
			searchInput.removeEventListener('input', handleInput);
		};
	}, [searchInput]);

	const filteredPets = useMemo(() => {
		const normalizedQuery = searchTerm.trim().toLowerCase();

		if (!normalizedQuery) {
			return pets;
		}

		return pets.filter((pet) => {
			const haystack = [pet.name, ...pet.info].join(' ').toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [pets, searchTerm]);

	if (fetchStatus === 'loading') {
		return <EmptyState title="Carregando pets" description="Buscando os pets cadastrados no servidor." />;
	}

	if (fetchStatus === 'error') {
		return <EmptyState title="Servidor indisponivel" description={fetchError} />;
	}

	if (!pets.length) {
		return <EmptyState title="Nenhum pet cadastrado" description="Faca login e cadastre um pet para exibir apenas os animais do usuario conectado." />;
	}

	return (
		<>
			{filteredPets.length ? (
				filteredPets.map((pet) => <PetCard key={pet.id} pet={pet} />)
			) : (
				<EmptyState
					title="Nenhum pet encontrado"
					description="Tente pesquisar por nome, tutor, exame, vacina ou veterinario."
				/>
			)}
		</>
	);
}

const cardsContainer = document.querySelector('.cards');
const searchInput = document.querySelector('.search__input');

if (cardsContainer) {
	createRoot(cardsContainer).render(<PetCardsApp searchInput={searchInput} />);
}