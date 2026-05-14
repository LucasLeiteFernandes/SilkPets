# SilkPets

Aplicacao com frontend em HTML/CSS/JS e backend Express conectado ao MongoDB para cadastrar usuarios e pets.

## Requisitos

- Node.js 18 ou superior
- MongoDB local ou remoto

## Como rodar

1. Crie um arquivo `.env` na raiz usando `.env.example` como base.
2. Ajuste `MONGO_URI` para a sua instancia do MongoDB.
3. Instale as dependencias com `npm install`.
4. Inicie o servidor com `npm start`.
5. Abra `http://localhost:3000`.

## Fluxo implementado

- Cadastro de usuario em `/api/users/register`
- Login em `/api/users/login`
- Cadastro de pet em `/api/pets`
- Listagem de pets na tela inicial consumindo `/api/pets`