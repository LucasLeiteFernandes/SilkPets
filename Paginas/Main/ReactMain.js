const { createRoot } = ReactDOM;
const { useEffect, useMemo, useState } = React;

function extractPets() {
	return Array.from(document.querySelectorAll('.cards .pet-card')).map((card) => ({
		id: card.id,
		name: card.querySelector('.pet-name')?.textContent?.trim() || '',
		image: card.querySelector('.pet-media img')?.getAttribute('src') || '',
		alt: card.querySelector('.pet-media img')?.getAttribute('alt') || 'Foto do pet',
		info: Array.from(card.querySelectorAll('.pet-info li')).map((item) => item.textContent.trim()),
		actions: Array.from(card.querySelectorAll('.pet-actions a')).map((link) => ({
			label: link.textContent.trim(),
			href: link.getAttribute('href') || '#',
		})),
	}));
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

function EmptyState() {
	return (
		<article className="pet-card">
			<div className="pet-card__left">
				<div className="pet-media">
					<img src="./Imagens/petIcon.png" alt="Nenhum pet encontrado" loading="lazy" />
				</div>
				<h2 className="pet-name">Nenhum pet encontrado</h2>
			</div>

			<div className="pet-card__right">
				<ul className="pet-info">
					<li>Tente pesquisar por nome, exame, vacina ou veterinario.</li>
				</ul>
			</div>
		</article>
	);
}

function PetCardsApp({ initialPets, searchInput }) {
	const [searchTerm, setSearchTerm] = useState(searchInput?.value || '');

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
			return initialPets;
		}

		return initialPets.filter((pet) => {
			const haystack = [pet.name, ...pet.info].join(' ').toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [initialPets, searchTerm]);

	return (
		<>
			{filteredPets.length ? filteredPets.map((pet) => <PetCard key={pet.id} pet={pet} />) : <EmptyState />}
		</>
	);
}

const cardsContainer = document.querySelector('.cards');
const searchInput = document.querySelector('.search__input');

if (cardsContainer) {
	const initialPets = extractPets();
	createRoot(cardsContainer).render(<PetCardsApp initialPets={initialPets} searchInput={searchInput} />);
}