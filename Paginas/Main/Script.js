// ===== ELEMENTOS DO DOM =====
const modalLogin = document.getElementById('modalLogin');
const modalCadastro = document.getElementById('modalCadastro');
const modalOverlay = document.getElementById('modalOverlay');

const btnLogin = document.getElementById('btnLogin');
const closeLogin = document.getElementById('closeLogin');
const closeCadastro = document.getElementById('closeCadastro');

const switchToCadastro = document.getElementById('switchToCadastro');
const switchToLogin = document.getElementById('switchToLogin');

const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');

// ===== FUNÇÕES PARA ABRIR E FECHAR MODAIS =====

function openModal(modal) {
	modal.classList.add('active');
	modalOverlay.classList.add('active');
	document.body.style.overflow = 'hidden'; // Previne scroll quando modal está aberto
}

function closeModal(modal) {
	modal.classList.remove('active');
	if (!modalLogin.classList.contains('active') && !modalCadastro.classList.contains('active')) {
		modalOverlay.classList.remove('active');
		document.body.style.overflow = 'auto';
	}
}

function closeAllModals() {
	modalLogin.classList.remove('active');
	modalCadastro.classList.remove('active');
	modalOverlay.classList.remove('active');
	document.body.style.overflow = 'auto';
}

// ===== EVENT LISTENERS PARA BOTÕES =====

// Abrir modal de login
btnLogin.addEventListener('click', () => {
	openModal(modalLogin);
	formLogin.reset();
});

// Fechar modal de login
closeLogin.addEventListener('click', () => {
	closeModal(modalLogin);
});

// Fechar modal de cadastro
closeCadastro.addEventListener('click', () => {
	closeModal(modalCadastro);
});

// Mudar para modal de cadastro
switchToCadastro.addEventListener('click', (e) => {
	e.preventDefault();
	closeModal(modalLogin);
	setTimeout(() => {
		openModal(modalCadastro);
		formCadastro.reset();
	}, 300);
});

// Mudar para modal de login
switchToLogin.addEventListener('click', (e) => {
	e.preventDefault();
	closeModal(modalCadastro);
	setTimeout(() => {
		openModal(modalLogin);
		formLogin.reset();
	}, 300);
});

// Fechar modal ao clicar no overlay
modalOverlay.addEventListener('click', () => {
	closeAllModals();
});

// ===== SUBMISSÃO DE FORMULÁRIOS =====

// Form de Login
formLogin.addEventListener('submit', (e) => {
	e.preventDefault();
	
	const email = document.getElementById('loginEmail').value;
	const password = document.getElementById('loginPassword').value;
	
	// Validação básica
	if (email && password) {
		console.log('Login realizado:', { email, password });
		alert('Login realizado com sucesso!');
		closeAllModals();
		formLogin.reset();
	}
});

// Form de Cadastro
formCadastro.addEventListener('submit', (e) => {
	e.preventDefault();
	
	const nome = document.getElementById('cadastroNome').value;
	const email = document.getElementById('cadastroEmail').value;
	const telefone = document.getElementById('cadastroTelefone').value;
	const password = document.getElementById('cadastroPassword').value;
	const confirm = document.getElementById('cadastroConfirm').value;
	
	// Validação de senhas
	if (password !== confirm) {
		alert('As senhas não conferem!');
		return;
	}
	
	if (password.length < 6) {
		alert('A senha deve ter pelo menos 6 caracteres!');
		return;
	}
	
	// Validação básica
	if (nome && email && password) {
		console.log('Cadastro realizado:', { nome, email, telefone, password });
		alert('Cadastro realizado com sucesso!');
		closeAllModals();
		formCadastro.reset();
	}
});

// Fechar modais com tecla ESC
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		closeAllModals();
	}
});
