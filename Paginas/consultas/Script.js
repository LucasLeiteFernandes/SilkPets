const { createRoot } = ReactDOM;
const { useState } = React;
const h = React.createElement;

const monthNames = [
	'JANEIRO',
	'FEVEREIRO',
	'MARCO',
	'ABRIL',
	'MAIO',
	'JUNHO',
	'JULHO',
	'AGOSTO',
	'SETEMBRO',
	'OUTUBRO',
	'NOVEMBRO',
	'DEZEMBRO',
];

const initialAppointments = [
	{ id: 1, day: 1, month: 3, year: 2025, time: '08:30' },
	{ id: 2, day: 20, month: 3, year: 2025, time: '09:11' },
];

function buildCalendarDays(date) {
	const firstWeekDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const days = [];

	for (let index = 0; index < firstWeekDay; index += 1) {
		days.push(null);
	}

	for (let day = 1; day <= totalDays; day += 1) {
		days.push(day);
	}

	return days;
}

function ConsultCard() {
	const [currentMonth, setCurrentMonth] = useState(new Date(2025, 3, 1));
	const [selectedDay, setSelectedDay] = useState(20);
	const [selectedTime, setSelectedTime] = useState('09:11');
	const [appointments, setAppointments] = useState(initialAppointments);
	const monthAppointments = appointments.filter(
		(appointment) =>
			appointment.month === currentMonth.getMonth() && appointment.year === currentMonth.getFullYear(),
	);

	const calendarDays = buildCalendarDays(currentMonth);
	const monthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

	function changeMonth(offset) {
		const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
		const totalDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

		setCurrentMonth(nextMonth);
		setSelectedDay((currentSelectedDay) => Math.min(currentSelectedDay, totalDays));
	}

	function handleAddAppointment() {
		const alreadyExists = appointments.some(
			(appointment) =>
				appointment.day === selectedDay &&
				appointment.month === currentMonth.getMonth() &&
				appointment.year === currentMonth.getFullYear() &&
				appointment.time === selectedTime,
		);

		if (alreadyExists) {
			window.alert('Esse horario ja esta marcado.');
			return;
		}

		setAppointments((currentAppointments) => [
			...currentAppointments,
			{
				id: Date.now(),
				day: selectedDay,
				month: currentMonth.getMonth(),
				year: currentMonth.getFullYear(),
				time: selectedTime,
			},
		]);
	}

	function handleRemoveAppointment() {
		const hasAppointment = appointments.some(
			(appointment) =>
				appointment.day === selectedDay &&
				appointment.month === currentMonth.getMonth() &&
				appointment.year === currentMonth.getFullYear() &&
				appointment.time === selectedTime,
		);

		if (!hasAppointment) {
			window.alert('Nao existe agendamento nesse horario.');
			return;
		}

		setAppointments((currentAppointments) =>
			currentAppointments.filter(
				(appointment) =>
					!(
						appointment.day === selectedDay &&
						appointment.month === currentMonth.getMonth() &&
						appointment.year === currentMonth.getFullYear() &&
						appointment.time === selectedTime
					),
			),
		);
	}

	function getDayClassName(day) {
		if (selectedDay === day) {
			return 'is-selected';
		}

		if (monthAppointments.some((appointment) => appointment.day === day)) {
			return 'is-marked';
		}

		return undefined;
	}

	const dateCells = calendarDays.map((day, index) => {
		if (!day) {
			return h('span', { className: 'is-empty', key: `empty-${index}`, 'aria-hidden': 'true' });
		}

		return h(
			'span',
			{
				key: day,
				className: getDayClassName(day),
				onClick: () => setSelectedDay(day),
			},
			day,
		);
	});

	return h(
		React.Fragment,
		null,
		h('div', { className: 'consult-photo' }, h('img', { src: '../../Imagens/gatoJoia.jpg', alt: 'Foto do pet' })),
		h(
			'div',
			{ className: 'consult-calendar' },
			h(
				'div',
				{ className: 'calendar', 'aria-label': 'Calendario de consultas' },
				h(
					'div',
					{ className: 'calendar__head' },
					h(
						'span',
						{ className: 'calendar__month' },
						monthLabel,
						' ',
						h('span', { className: 'calendar__caret' }, '›'),
					),
					h(
						'div',
						{ className: 'calendar__nav' },
						h(
							'button',
							{ type: 'button', className: 'calendar__nav-btn', 'aria-label': 'Mes anterior', onClick: () => changeMonth(-1) },
							'‹',
						),
						h(
							'button',
							{ type: 'button', className: 'calendar__nav-btn', 'aria-label': 'Proximo mes', onClick: () => changeMonth(1) },
							'›',
						),
					),
				),
				h(
					'div',
					{ className: 'calendar__grid calendar__grid--days' },
					h('span', null, 'DOM'),
					h('span', null, 'SEG'),
					h('span', null, 'TER'),
					h('span', null, 'QUA'),
					h('span', null, 'QUI'),
					h('span', null, 'SEX'),
					h('span', null, 'SAB'),
				),
				h('div', { className: 'calendar__grid calendar__grid--dates' }, ...dateCells),
				h(
					'div',
					{ className: 'calendar__time' },
					h('span', { className: 'calendar__time-label' }, 'Horas'),
					h('input', {
						className: 'calendar__time-input',
						type: 'time',
						value: selectedTime,
						onChange: (event) => setSelectedTime(event.target.value),
					}),
				),
			),
		),
		h('h2', { className: 'consult-pet-name' }, 'Gato Joia'),
		h(
			'div',
			{ className: 'consult-actions' },
			h('button', { type: 'button', className: 'btn btn--ghost', onClick: handleAddAppointment }, 'Adicionar'),
			h('button', { type: 'button', className: 'btn btn--ghost', onClick: handleRemoveAppointment }, 'Remover'),
		),
	);
}

const root = document.querySelector('.consult-card');

if (root) {
	createRoot(root).render(h(ConsultCard));
}
