let paginaAtual = 'dashboard';

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        document
            .querySelectorAll('.nav')
            .forEach(btn => {
                btn.addEventListener(
                    'click',
                    () => navegar(btn.dataset.page)
                );
            });

        await testarConexao();
        navegar('dashboard');
    }
);

function setTitulo(titulo, subtitulo) {
    document.getElementById('pageTitle').textContent = titulo;
    document.getElementById('pageSubtitle').textContent = subtitulo || '';
}

function setActive(page) {
    document
        .querySelectorAll('.nav')
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

    app.innerHTML = `
        <div class="painel">
            <p class="msg">Carregando...</p>
        </div>
    `;

    try {
        if (page === 'dashboard') {
            await renderDashboard();
        }

        if (page === 'entradas') {
            await renderEntradas();
        }

        if (page === 'saidas') {
            await renderSaidas();
        }

        if (page === 'mensalidades') {
            await renderMensalidades();
        }

        if (page === 'recorrencias') {
            await renderRecorrencias();
        }

        if (page === 'previsao') {
            await renderPrevisao();
        }

        if (page === 'relatorios') {
            await renderRelatorios();
        }

        if (page === 'configuracoes') {
            await renderConfiguracoes();
        }
    } catch (erro) {
        console.error(erro);

        app.innerHTML = `
            <div class="painel">
                <p class="msg">
                    Erro: ${escapeHtml(erro.message)}
                </p>
            </div>
        `;
    }
}
