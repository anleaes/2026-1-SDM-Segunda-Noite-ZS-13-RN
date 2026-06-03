# Museu & Galeria — App React Native (Expo)

Aplicativo mobile do **Sistema de Gerenciamento de Museus e Galerias de Arte**, conectado 100% ao backend Django REST.

Repositório backend: [2026-1-SDM-Segunda-Noite-ZS-13](https://github.com/anleaes/2026-1-SDM-Segunda-Noite-ZS-13)

## Stack

- **Expo SDK 54.0.2** + **Expo Router 6**
- **React Native 0.81** / **React 19**
- **TypeScript**
- API REST Django (`/api/`)

## Alinhamento com o diagrama UML

| Perfil | Métodos do diagrama | Implementação no app |
|--------|---------------------|----------------------|
| **Visitante** | `comprarIngresso`, `realizarReserva`, `avaliarExposicao` | Detalhe da exposição + histórico no perfil |
| **Visitante** | cadastro | Tela `register` → `POST /api/auth/register/` |
| **Funcionário** | galerias + `cadastrarObra` | Galerias → **+ Nova galeria** |
| **Funcionário** | `gerenciarExposicao` | Exposições ou detalhe da galeria → **+ Nova exposição** |
| **Funcionário** | `gerarRelatorio` | Perfil → **Relatório operacional** |
| **Funcionário** | restaurações | Detalhe Obra → **Registrar restauração** |
| **Artista** | `atualizarPortfolio` | Perfil → editar nacionalidade/estilo + listar obras vinculadas |
| **Admin** | gestão ampla | Igual funcionário + visão de todas restaurações |
| **Todos** | consulta ApiRest | Home, listagens com pull-to-refresh |

## Configuração

```bash
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL
npm run start
```

Backend: `python manage.py runserver 0.0.0.0:8000`

## Usuários de teste (seed_demo)

| Usuário | Senha | Perfil |
|---------|-------|--------|
| `nathan.visitante` | `demo123` | Visitante |
| `nathan.funcionario` | `demo123` | Funcionário |
| `nathan.artista` | `demo123` | Artista |
| `admin` | `admin123` | Administrador |

## Permissões (AuthContext)

| Flag | Quem | Uso |
|------|------|-----|
| `isVisitante` | visitante | Ingresso, reserva, avaliação |
| `canStaff` | funcionário + admin | Galerias, obras e exposições |
| `canManageGaleria` | funcionário + admin | Alias de canStaff para galerias |
| `canRestauracao` | funcionário + admin | Registrar restauração |
| `isArtista` | artista | Portfolio |
