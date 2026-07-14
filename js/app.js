let paginaAtual = 'dashboard';

document.addEventListener('DOMContentLoaded', async () => {
    const menu = document.querySelector('.sidebar');
    const botaoMenuInferior = document.getElementById('btnMenuInferior');

    if (botaoMenuInferior && menu) {
        botaoMenuInferior.addEventListener('click', evento => {
            evento.preventDefault();
            evento.stopPropagation();

            menu.classList.toggle('menu-aberto');
        });
    }

    if (menu) {
        menu.addEventListener('click', async evento => {
            const botao = evento.target.closest('[data-page]');

            if (!botao) {
                return;
            }

            evento.preventDefault();

            const pagina = botao.dataset.page;

            if (!pagina) {
                return;
            }

            await navegar(pagina);

            if (window.innerWidth <= 768) {
                menu.classList.remove('menu-aberto');
            }
        });
    }

    await testarConexao();
    await navegar('dashboard');
});

function setTitulo(titulo, subtitulo) {
    const tituloElemento = document.getElementById('pageTitle');
    const subtituloElemento = document.getElementById('pageSubtitle');

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (subtituloElemento) {
        subtituloElemento.textContent = subtitulo || '';
    }
}

function setActive(page) {
    document
        .querySelectorAll('[data-page]')
        .forEach(botao => {
            botao.classList.toggle(
                'active',
                botao.dataset.page === page
            );
        });
}

async function navegar(page) {
    paginaAtual = page;
    setActive(page);

    const app = document.getElementById('app');

    if (!app) {
        console.error('Área principal do sistema não encontrada.');
        return;
    }

    app.innerHTML = `
        <div class="painel">
            <p class="msg">Carregando...</p>
        </div>
    `;

    try {
        switch (page) {
            case 'dashboard':
                await renderDashboard();
                break;

            case 'entradas':
                await renderEntradas();
                break;

            case 'saidas':
                await renderSaidas();
                break;

            case 'mensalidades':
                await renderMensalidades();
                break;

            case 'recorrencias':
                await renderRecorrencias();
                break;

            case 'previsao':
                await renderPrevisao();
                break;

            case 'relatorios':
                await renderRelatorios();
                break;

            case 'configuracoes':
                await renderConfiguracoes();
                break;

            default:
                await renderDashboard();
                break;
        }

        if (window.innerWidth <= 768) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    } catch (erro) {
        console.error(erro);

        app.innerHTML = `
            <div class="painel">
                <p class="msg">
                    Erro: ${escapeHtml(
                        erro?.message ||
                        'Não foi possível abrir esta página.'
                    )}
                </p>
            </div>
        `;
    }
}
