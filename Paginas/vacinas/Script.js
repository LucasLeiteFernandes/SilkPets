const { createRoot } = ReactDOM;
const { useEffect, useMemo, useState } = React;

function extractRecords(panel) {
	return Array.from(panel.querySelectorAll('.vaccine-log__row:not(.vaccine-log__row--head)')).map((row, index) => {
		const columns = row.querySelectorAll('span');

		return {
			id: `record-${index}`,
			date: columns[0]?.textContent?.trim() || '',
			name: columns[1]?.textContent?.trim() || '',
			dose: columns[2]?.textContent?.trim() || '',
		};
	});
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
					<span>Nenhum</span>
					<span>resultado</span>
					<span></span>
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
			<div className="notes__lines" aria-hidden="true">
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
			</div>
		</section>
	);
}

function VaccinePanelApp({ initialRecords, searchInput }) {
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

	const filteredRecords = useMemo(() => {
		const normalizedQuery = searchTerm.trim().toLowerCase();

		if (!normalizedQuery) {
			return initialRecords;
		}

		return initialRecords.filter((record) => {
			const content = [record.date, record.name, record.dose].join(' ').toLowerCase();
			return content.includes(normalizedQuery);
		});
	}, [initialRecords, searchTerm]);

	return (
		<>
			<h1 className="panel__title">Vacinas</h1>
			<div className="vaccine-log" aria-label="Registro de vacinas">
				<VaccineTable records={filteredRecords} />
			</div>
			<NotesSection />
		</>
	);
}

const panel = document.querySelector('.panel--table');
const searchInput = document.querySelector('.search__input');

if (panel) {
	const initialRecords = extractRecords(panel);
	createRoot(panel).render(<VaccinePanelApp initialRecords={initialRecords} searchInput={searchInput} />);
}
