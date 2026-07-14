async function renderDashboard() {
    setTitulo(
        "Controle de Caixa",
        "Resumo financeiro da escola"
    );

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const [
        entradas,
        saidas,
        recorrencias,
        mensalidades,
        saldoInicialRaw
    ] = await Promise.all([
        buscar("entradas"),
        buscar("saidas"),
        buscar("recorrencias"),
        buscar("mensalidades"),
        buscarConfig("saldoInicial")
    ]);

    const saldoInicial = Number(saldoInicialRaw || 0);

    function dataNoMesAtual(dataTexto) {
        if (!dataTexto) {
            return false;
        }

        const data = new Date(`${dataTexto}T00:00:00`);

        return (
            data.getFullYear() === anoAtual &&
            data.getMonth() === mesAtual
        );
    }

    const entradasMes = entradas.filter(
        item => dataNoMesAtual(item.data)
    );

    const saidasMes = saidas.filter(
        item => dataNoMesAtual(item.data)
    );

    const mensalidadesPagasMes = mensalidades.filter(
        item =>
            item.pago === true &&
            dataNoMesAtual(item.data_pagamento)
    );

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
    );

    const entradasRecorrentesMes = recorrenciasAtivas
        .filter(item => item.tipo === "entrada")
        .reduce(
            (soma, item) =>
                soma + Number(item.valor || 0),
            0
        );

    const saidasRecorrentesMes = recorrenciasAtivas
        .filter(item => item.tipo === "saida")
        .reduce(
            (soma, item) =>
                soma + Number(item.valor || 0),
            0
        );

    const totalMensalidadesPagas = mensalidadesPagasMes.reduce(
        (soma, item) =>
            soma + Number(item.valor || 0),
        0
    );

    const totalEntradasManuais = entradasMes.reduce(
        (soma, item) =>
            soma + Number(item.valor || 0),
        0
    );

    const totalSaidasManuais = saidasMes.reduce(
        (soma, item) =>
            soma + Number(item.valor || 0),
        0
    );

    const totalEntradas =
        totalEntradasManuais +
        entradasRecorrentesMes +
        totalMensalidadesPagas;

    const totalSaidas =
        totalSaidasManuais +
        saidasRecorrentesMes;

    const saldo =
        saldoInicial +
        totalEntradas -
        totalSaidas;

    const ultimosLancamentos = [
        ...entradasMes.map(item => ({
            data: item.data,
            tipo: "entrada",
            tipoTexto: "Entrada",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        })),

        ...saidasMes.map(item => ({
            data: item.data,
            tipo: "saida",
            tipoTexto: "Saída",
            descricao: item.descricao,
            valor: Number(item.valor || 0)
        })),

        ...mensalidadesPagasMes.map(item => ({
            data: item.data_pagamento,
            tipo: "mensalidade",
            tipoTexto: "Mensalidade",
            descricao: `Mensalidade - ${item.aluno}`,
            valor: Number(item.valor || 0)
        }))
    ]
        .sort((a, b) =>
            String(b.data).localeCompare(String(a.data))
        )
        .slice(0, 10);

    document.getElementById("app").innerHTML = `
        <section class="dashboard-v2">

            <div class="saldo-destaque ${
                saldo < 0 ? "saldo-negativo" : ""
            }">
                <span>💰 Saldo atual</span>

                <strong>${moeda(saldo)}</strong>

                <div class="saldo-movimentos">
                    <small>
                        ▲ ${moeda(totalEntradas)} em entradas
                    </small>

                    <small>
                        ▼ ${moeda(totalSaidas)} em saídas
                    </small>
                </div>
            </div>

            <div class="resumo-dashboard">

                <div class="resumo-card entrada">
                    <span>Entradas do mês</span>
                    <strong>${moeda(totalEntradas)}</strong>
                </div>

                <div class="resumo-card saida">
                    <span>Saídas do mês</span>
                    <strong>${moeda(totalSaidas)}</strong>
                </div>

                <div class="resumo-card mensalidade">
                    <span>Mensalidades pagas</span>
                    <strong>${moeda(totalMensalidadesPagas)}</strong>
                </div>

                <div class="resumo-card inicial">
                    <span>Saldo inicial</span>
                    <strong>${moeda(saldoInicial)}</strong>
                </div>

            </div>

            <div class="acoes-dashboard">

                <button
                    type="button"
                    class="acao-rapida entrada"
                    onclick="navegar('entradas')"
                >
                    <span>➕</span>
                    Nova entrada
                </button>

                <button
                    type="button"
                    class="acao-rapida saida"
                    onclick="navegar('saidas')"
                >
                    <span>➖</span>
                    Nova saída
                </button>

                <button
                    type="button"
                    class="acao-rapida mensalidade"
                    onclick="navegar('mensalidades')"
                >
                    <span>🎓</span>
                    Mensalidades
                </button>

                <button
                    type="button"
                    class="acao-rapida recorrencia"
                    onclick="navegar('recorrencias')"
                >
                    <span>🔄</span>
                    Recorrências
                </button>

            </div>

            <div class="painel composicao-dashboard">

                <h2>Resumo do mês</h2>

                <div class="composicao-lista">

                    <div class="composicao-item">
                        <span>Entradas manuais</span>
                        <strong>
                            ${moeda(totalEntradasManuais)}
                        </strong>
                    </div>

                    <div class="composicao-item">
                        <span>Entradas recorrentes</span>
                        <strong>
                            ${moeda(entradasRecorrentesMes)}
                        </strong>
                    </div>

                    <div class="composicao-item">
                        <span>Mensalidades pagas</span>
                        <strong>
                            ${moeda(totalMensalidadesPagas)}
                        </strong>
                    </div>

                    <div class="composicao-item saida">
                        <span>Saídas manuais</span>
                        <strong>
                            ${moeda(totalSaidasManuais)}
                        </strong>
                    </div>

                    <div class="composicao-item saida">
                        <span>Saídas recorrentes</span>
                        <strong>
                            ${moeda(saidasRecorrentesMes)}
                        </strong>
                    </div>

                </div>

            </div>

            <div class="painel lancamentos-dashboard">

                <div class="titulo-lancamentos">
                    <h2>Últimos lançamentos</h2>
                    <p>Movimentações realizadas no mês atual</p>
                </div>

                ${
                    ultimosLancamentos.length
                        ? `
                            <div class="lista-lancamentos-mobile">

                                ${ultimosLancamentos.map(item => `
                                    <div class="lancamento-mobile">

                                        <div class="icone-lancamento ${
                                            item.tipo
                                        }">
                                            ${
                                                item.tipo === "entrada"
                                                    ? "↑"
                                                    : item.tipo === "saida"
                                                        ? "↓"
                                                        : "🎓"
                                            }
                                        </div>

                                        <div class="dados-lancamento">
                                            <strong>
                                                ${escapeHtml(item.descricao)}
                                            </strong>

                                            <span>
                                                ${item.tipoTexto}
                                                •
                                                ${dataBR(item.data)}
                                            </span>
                                        </div>

                                        <strong class="valor-lancamento ${
                                            item.tipo
                                        }">
                                            ${
                                                item.tipo === "saida"
                                                    ? "- "
                                                    : "+ "
                                            }
                                            ${moeda(item.valor)}
                                        </strong>

                                    </div>
                                `).join("")}

                            </div>
                        `
                        : `
                            <p class="msg">
                                Nenhum lançamento cadastrado neste mês.
                            </p>
                        `
                }

            </div>

        </section>
    `;
}
