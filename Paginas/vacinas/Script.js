const { createRoot } = ReactDOM;
const { useEffect, useMemo, useState } = React;

const DEFAULT_PET_IMAGE = '/Paginas/Main/Imagens/petIcon.png';
const LOCAL_API_ORIGIN = 'http://localhost:3000';

function resolveApiBaseUrl() {
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

const apiBaseUrl = resolveApiBaseUrl();

function getSelectedPetIdFromLocation() {
	const params = new URLSearchParams(window.location.search);
	return params.get('pet') || '';
}

function updateSelectedPetInLocation(petId) {
	const url = new URL(window.location.href);

	if (petId) {
		url.searchParams.set('pet', petId);
	} else {
		url.searchParams.delete('pet');
	}

	window.history.replaceState({}, '', url);
}

function normalizePet(pet) {
	return {
		id: pet.id || '',
		name: pet.nome || 'Pet sem nome',
		image: pet.imagem || DEFAULT_PET_IMAGE,
		description: pet.descricao || 'Sem descricao cadastrada.',
		age: pet.idade || 'Nao informada',
		vaccinesStatus: pet.vacinas || 'Nao informado',
		veterinarian: pet.veterinario || 'Nao informado',
		ownerName: pet.ownerName || 'Nao informado',
	};
}

function buildVaccineRecords(vaccinesStatus) {
	const normalizedStatus = String(vaccinesStatus || '').trim();

	if (!normalizedStatus || normalizedStatus === 'Nao informado') {
		return [];
	}

	const entries = normalizedStatus
		.split(/\r?\n|;|,/)
		.map((item) => item.trim())
		.filter(Boolean);

	const normalizedEntries = entries.length ? entries : [normalizedStatus];

	return normalizedEntries.map((entry, index) => ({
		id: `record-${index}`,
		date: 'Nao informada',
		name: entry,
		dose: `Registro ${index + 1}`,
	}));
}

function VaccineTable({ records }) {
	if (!records.length) {
		return (
			<>
				<div className="vaccine-log__row vaccine-log__row--head">
					<span>Data</span>
					<span>Nome</span>
					<span>Dose</span>
				</div>
				<div className="vaccine-log__row">
					<span>Nao ha</span>
					<span>vacinas cadastradas</span>
					<span>-</span>
				</div>
			</>
		);
	}

	return records.map((record) => (
		<React.Fragment key={record.id}>
			<div className="vaccine-log__row vaccine-log__row--head">
				<span>Data</span>
				<span>Nome</span>
				<span>Dose</span>
			</div>
			<div className="vaccine-log__row">
				<span>{record.date}</span>
				<span>{record.name}</span>
				<span>{record.dose}</span>
			</div>
		</React.Fragment>
	));
}

function NotesSection() {
	return (
		<section className="notes" aria-label="Observações">
			<h2 className="notes__title">Observações</h2>
			<p className="notes__text">Atualize o campo de vacinas ao editar o cadastro do pet para manter esta ficha em dia.</p>
		</section>
	);
}

function PetTabs({ pets, selectedPetId, onSelect }) {
	return (
		<section className="panel panel--pet-tabs" aria-label="Pets cadastrados">
			<div className="pet-tabs">
				{pets.map((pet) => (
					<button
						className={`pet-tab${pet.id === selectedPetId ? ' pet-tab--active' : ''}`}
						key={pet.id}
						type="button"
						onClick={() => onSelect(pet.id)}
					>
						{pet.name}
					</button>
				))}
			</div>
		</section>
	);
}

function EmptyState({ title, description }) {
	return (
		<section className="panel panel--empty" aria-live="polite">
			<h1 className="panel__title">{title}</h1>
			<p className="empty-state__text">{description}</p>
		</section>
	);
}

function VaccineSheet({ pet, records }) {
	return (
		<>
			<div className="vaccine-sheet__left">
				<section className="panel panel--table">
					<h1 className="panel__title">Vacinas de {pet.name}</h1>

					<div className="vaccine-log" aria-label={`Registro de vacinas de ${pet.name}`}>
						<VaccineTable records={records} />
					</div>

					<NotesSection />
				</section>
			</div>

			<div className="vaccine-sheet__right">
				<section className="panel panel--hero">
					<div className="pet-photo">
						<img src={pet.image} alt={`Foto de ${pet.name}`} />
					</div>

					<div className="pet-description">
						<p>{pet.description}</p>
					</div>
				</section>

				<section className="panel panel--details" aria-label={`Detalhes de ${pet.name}`}>
					<div className="detail detail--full">Nome: {pet.name}</div>
					<div className="detail">Idade: {pet.age}</div>
					<div className="detail">Tutor: {pet.ownerName}</div>
					<div className="detail detail--full">Vacinas: {pet.vaccinesStatus}</div>
					<div className="detail detail--full">Veterinario: {pet.veterinarian}</div>
				</section>
			</div>
		</>
	);
}

function VaccinePanelApp({ searchInput }) {
	const [pets, setPets] = useState([]);
	const [fetchStatus, setFetchStatus] = useState('loading');
	const [fetchError, setFetchError] = useState('');
	const [searchTerm, setSearchTerm] = useState(searchInput?.value || '');
	const [selectedPetId, setSelectedPetId] = useState(getSelectedPetIdFromLocation());

	useEffect(() => {
		let shouldUpdate = true;

		async function loadPets() {
			setFetchStatus('loading');

			try {
				const response = await fetch(`${apiBaseUrl}/api/pets`, {
					credentials: 'include',
				});
				const contentType = response.headers.get('content-type') || '';
				const data = contentType.includes('application/json') ? await response.json() : {};

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
				if (!shouldUpdate) {
					return;
				}

				setFetchError(error.message || 'Nao foi possivel carregar as vacinas.');
				setFetchStatus('error');
			}
		}

		loadPets();

		return () => {
			shouldUpdate = false;
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
			const content = [pet.name, pet.description, pet.vaccinesStatus, pet.veterinarian, pet.ownerName].join(' ').toLowerCase();
			return content.includes(normalizedQuery);
		});
	}, [pets, searchTerm]);

	useEffect(() => {
		if (!filteredPets.length) {
			if (selectedPetId) {
				setSelectedPetId('');
				updateSelectedPetInLocation('');
			}
			return;
		}

		const selectedPetStillAvailable = filteredPets.some((pet) => pet.id === selectedPetId);

		if (selectedPetStillAvailable) {
			return;
		}

		const petFromQuery = getSelectedPetIdFromLocation();
		const nextPet = filteredPets.find((pet) => pet.id === petFromQuery) || filteredPets[0];

		setSelectedPetId(nextPet.id);
		updateSelectedPetInLocation(nextPet.id);
	}, [filteredPets, selectedPetId]);

	function handleSelectPet(petId) {
		setSelectedPetId(petId);
		updateSelectedPetInLocation(petId);
	}

	const selectedPet = filteredPets.find((pet) => pet.id === selectedPetId) || null;
	const activePet = selectedPet || filteredPets[0] || null;
	const selectedPetRecords = activePet ? buildVaccineRecords(activePet.vaccinesStatus) : [];

	if (fetchStatus === 'loading') {
		return <EmptyState title="Carregando vacinas" description="Buscando os pets do usuario conectado." />;
	}

	if (fetchStatus === 'error') {
		return <EmptyState title="Servidor indisponivel" description={fetchError} />;
	}

	if (!pets.length) {
		return <EmptyState title="Nenhum pet cadastrado" description="Faca login e cadastre um pet para ver a ficha de vacinas dele aqui." />;
	}

	if (!filteredPets.length) {
		return <EmptyState title="Nenhum pet encontrado" description="A pesquisa nao encontrou pets ou vacinas com esse termo." />;
	}

	return (
		<>
			<PetTabs pets={filteredPets} selectedPetId={selectedPet?.id || ''} onSelect={handleSelectPet} />
			<VaccineSheet pet={activePet} records={selectedPetRecords} />
		</>
	);
}

const panel = document.querySelector('.vaccine-sheet');
const searchInput = document.querySelector('.search__input');

if (panel) {
	createRoot(panel).render(<VaccinePanelApp searchInput={searchInput} />);
}
