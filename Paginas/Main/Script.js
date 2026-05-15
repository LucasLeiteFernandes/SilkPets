const modalLogin = document.getElementById('modalLogin');
const modalCadastro = document.getElementById('modalCadastro');
const modalPet = document.getElementById('modalPet');
const modalOverlay = document.getElementById('modalOverlay');

const btnLogin = document.getElementById('btnLogin');
const btnMeusPets = document.getElementById('btnMeusPets');
const btnPerfil = document.getElementById('btnPerfil');

const closeLogin = document.getElementById('closeLogin');
const closeCadastro = document.getElementById('closeCadastro');
const closePet = document.getElementById('closePet');

const switchToCadastro = document.getElementById('switchToCadastro');
const switchToLogin = document.getElementById('switchToLogin');

const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');
const formPet = document.getElementById('formPet');

const loginMessage = document.getElementById('loginMessage');
const cadastroMessage = document.getElementById('cadastroMessage');
const petMessage = document.getElementById('petMessage');
const sessionBadge = document.getElementById('sessionBadge');
const petOwnerName = document.getElementById('petOwnerName');

const STORAGE_USER_KEY = 'silkpets:user';
const LOCAL_API_ORIGIN = 'http://localhost:3000';

let currentUser = readStoredUser();

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

function readStoredUser() {
	try {
		const storedUser = localStorage.getItem(STORAGE_USER_KEY);
		return storedUser ? JSON.parse(storedUser) : null;
	} catch (_error) {
		localStorage.removeItem(STORAGE_USER_KEY);
		return null;
	}
}

function persistUser(user) {
	currentUser = user;

	if (user) {
		localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
	} else {
		localStorage.removeItem(STORAGE_USER_KEY);
	}

	renderSessionState();
}

function setMessage(element, message, type) {
	if (!element) {
		return;
	}

	element.textContent = message || '';
	element.classList.remove('form__message--error', 'form__message--success');

	if (!message) {
		return;
	}

	element.classList.add(type === 'error' ? 'form__message--error' : 'form__message--success');
}

function clearMessages() {
	setMessage(loginMessage, '');
	setMessage(cadastroMessage, '');
	setMessage(petMessage, '');
}

function openModal(modal) {
	if (!modal) {
		return;
	}

	modal.classList.add('active');
	modalOverlay.classList.add('active');
	document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
	if (!modal) {
		return;
	}

	modal.classList.remove('active');

	if (![modalLogin, modalCadastro, modalPet].some((currentModal) => currentModal.classList.contains('active'))) {
		modalOverlay.classList.remove('active');
		document.body.style.overflow = 'auto';
	}
}

function closeAllModals() {
	[modalLogin, modalCadastro, modalPet].forEach((modal) => modal.classList.remove('active'));
	modalOverlay.classList.remove('active');
	document.body.style.overflow = 'auto';
	clearMessages();
}

function renderSessionState() {
	const isLoggedIn = Boolean(currentUser && currentUser.id);

	btnLogin.textContent = isLoggedIn ? 'SAIR' : 'LOGIN';
	btnPerfil.title = isLoggedIn ? `Usuario conectado: ${currentUser.nome}` : 'Entrar ou cadastrar usuario';
	petOwnerName.textContent = isLoggedIn ? currentUser.nome : 'Nenhum usuario conectado';
	sessionBadge.textContent = isLoggedIn
		? `${currentUser.nome} conectado(a). Agora voce pode cadastrar um pet e ele aparecera nesta tela.`
		: 'Faça login para cadastrar seu usuario e seu pet.';

	//console.log(currentUser)
}

async function requestJson(url, options = {}) {
	let response;

	try {
		response = await fetch(`${apiBaseUrl}${url}`, {
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {}),
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
		});
	} catch (_error) {
		throw new Error('Nao foi possivel conectar ao servidor. Inicie o backend do SilkPets em http://localhost:3000.');
	}

	const contentType = response.headers.get('content-type') || '';
	const data = contentType.includes('application/json') ? await response.json() : {};

	if (!response.ok) {
		throw new Error(data.message || 'Nao foi possivel concluir a solicitacao.');
	}

	return data;
}

btnLogin.addEventListener('click', () => {
	if (currentUser) {
		persistUser(null);
		closeAllModals();
		return;
	}

	formLogin.reset();
	setMessage(loginMessage, '');
	openModal(modalLogin);
});

btnMeusPets.addEventListener('click', () => {
	if (!currentUser) {
		setMessage(loginMessage, 'Faça login ou cadastre um usuario antes de adicionar um pet.', 'error');
		formLogin.reset();
		openModal(modalLogin);
		return;
	}

	formPet.reset();
	setMessage(petMessage, '');
	openModal(modalPet);
});

btnPerfil.addEventListener('click', (event) => {
	event.preventDefault();

	if (currentUser) {
		formPet.reset();
		setMessage(petMessage, '');
		openModal(modalPet);
		return;
	}

	formLogin.reset();
	setMessage(loginMessage, '');
	openModal(modalLogin);
});

closeLogin.addEventListener('click', () => {
	closeModal(modalLogin);
	setMessage(loginMessage, '');
});

closeCadastro.addEventListener('click', () => {
	closeModal(modalCadastro);
	setMessage(cadastroMessage, '');
});

closePet.addEventListener('click', () => {
	closeModal(modalPet);
	setMessage(petMessage, '');
});

switchToCadastro.addEventListener('click', (event) => {
	event.preventDefault();
	closeModal(modalLogin);
	setTimeout(() => {
		formCadastro.reset();
		setMessage(cadastroMessage, '');
		openModal(modalCadastro);
	}, 200);
});

switchToLogin.addEventListener('click', (event) => {
	event.preventDefault();
	closeModal(modalCadastro);
	setTimeout(() => {
		formLogin.reset();
		setMessage(loginMessage, '');
		openModal(modalLogin);
	}, 200);
});

modalOverlay.addEventListener('click', () => {
	closeAllModals();
});

formLogin.addEventListener('submit', async (event) => {
	event.preventDefault();

	const email = document.getElementById('loginEmail').value.trim();
	const password = document.getElementById('loginPassword').value;

	try {
		setMessage(loginMessage, 'Validando login...');
		const data = await requestJson('/api/users/login', {
			method: 'POST',
			body: { email, password },
		});

		persistUser(data.user);
		window.dispatchEvent(new CustomEvent('user:changed', { detail: data.user }));
		formLogin.reset();
		closeAllModals();
	} catch (error) {
		setMessage(loginMessage, error.message, 'error');
	}
});

formCadastro.addEventListener('submit', async (event) => {
	event.preventDefault();

	const nome = document.getElementById('cadastroNome').value.trim();
	const email = document.getElementById('cadastroEmail').value.trim();
	const telefone = document.getElementById('cadastroTelefone').value.trim();
	const password = document.getElementById('cadastroPassword').value;
	const confirm = document.getElementById('cadastroConfirm').value;

	if (password !== confirm) {
		setMessage(cadastroMessage, 'As senhas nao conferem.', 'error');
		return;
	}

	if (password.length < 6) {
		setMessage(cadastroMessage, 'A senha deve ter pelo menos 6 caracteres.', 'error');
		return;
	}

	try {
		setMessage(cadastroMessage, 'Criando usuario...');
		const data = await requestJson('/api/users/register', {
			method: 'POST',
			body: { nome, email, telefone, password },
		});

		persistUser(data.user);
		window.dispatchEvent(new CustomEvent('user:changed', { detail: data.user }));
		formCadastro.reset();
		closeAllModals();
		setMessage(petMessage, 'Usuario criado com sucesso. Agora cadastre o pet.', 'success');
		openModal(modalPet);
	} catch (error) {
		setMessage(cadastroMessage, error.message, 'error');
	}
});

formPet.addEventListener('submit', async (event) => {
	event.preventDefault();

	if (!currentUser) {
		setMessage(petMessage, 'Voce precisa estar logado para cadastrar um pet.', 'error');
		closeModal(modalPet);
		openModal(modalLogin);
		return;
	}

	const nome = document.getElementById('petNome').value.trim();
	const idade = document.getElementById('petIdade').value.trim();
	const exames = document.getElementById('petExames').value.trim();
	const veterinario = document.getElementById('petVeterinario').value.trim();
	const vacinas = document.getElementById('petVacinas').value.trim();
	const imagem = document.getElementById('petImagem').value.trim();
	const descricao = document.getElementById('petDescricao').value.trim();

	try {
		setMessage(petMessage, 'Salvando pet...');
		await requestJson('/api/pets', {
			method: 'POST',
			body: {
				ownerId: currentUser.id,
				nome,
				idade,
				exames,
				veterinario,
				vacinas,
				descricao,
				imagem,
			},
		});

		formPet.reset();
		closeAllModals();
		window.dispatchEvent(new CustomEvent('pets:changed'));
	} catch (error) {
		setMessage(petMessage, error.message, 'error');
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeAllModals();
	}
});

renderSessionState();
