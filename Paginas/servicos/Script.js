const { createRoot } = ReactDOM;
const { useEffect, useMemo, useState } = React;

function extractServiceCards() {
	return Array.from(document.querySelectorAll('.services-grid .service-card')).map((card) => ({
		id: card.querySelector('.service-card__title')?.textContent?.trim() || Math.random().toString(36),
		title: card.querySelector('.service-card__title')?.textContent?.trim() || '',
		wide: card.classList.contains('service-card--wide'),
		items: Array.from(card.querySelectorAll('.service-item')).map((item) => ({
			text: item.textContent.trim(),
			header: item.classList.contains('service-item--head'),
		})),
	}));
}

function ServiceCard({ card }) {
	const className = card.wide ? 'service-card service-card--wide' : 'service-card';

	return (
		<article className={className}>
			<h2 className="service-card__title">{card.title}</h2>
			<ul className="service-list">
				{card.items.map((item) => (
					<li className={item.header ? 'service-item service-item--head' : 'service-item'} key={`${card.id}-${item.text}`}>
						{item.text}
					</li>
				))}
			</ul>
		</article>
	);
}

function EmptyState() {
	return (
		<article className="service-card service-card--wide">
			<h2 className="service-card__title">Nenhum serviço encontrado</h2>
			<ul className="service-list">
				<li className="service-item service-item--head">Tente pesquisar por atendimento, microchip ou nome do veterinário.</li>
			</ul>
		</article>
	);
	}

function ServicesApp({ initialCards, searchInput }) {
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

	const filteredCards = useMemo(() => {
		const normalizedQuery = searchTerm.trim().toLowerCase();

		if (!normalizedQuery) {
			return initialCards;
		}

		return initialCards.filter((card) => {
			const content = [card.title, ...card.items.map((item) => item.text)].join(' ').toLowerCase();
			return content.includes(normalizedQuery);
		});
	}, [initialCards, searchTerm]);

	return <>{filteredCards.length ? filteredCards.map((card) => <ServiceCard key={card.id} card={card} />) : <EmptyState />}</>;
}

const servicesGrid = document.querySelector('.services-grid');
const searchInput = document.querySelector('.search__input');

if (servicesGrid) {
	const initialCards = extractServiceCards();
	createRoot(servicesGrid).render(<ServicesApp initialCards={initialCards} searchInput={searchInput} />);
}
