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

    function pertenceMesAtual(item) {
        if (!item.data) {
            return false;
        }

        const data = new Date(item.data + "T00:00:00");

        return (
            data.getFullYear() === anoAtual &&
            data.getMonth() === mesAtual
        );
    }

    function mensalidadePagaNoMesAtual(item) {
        if (
            item.pago !== true ||
            !item.data_pagamento
        ) {
            return false;
        }

        const dataPagamento = new Date(
            item.data_pagamento + "T00:00:00"
        );

        return (
            dataPagamento.getFullYear() === anoAtual &&
            dataPagamento.getMonth() === mesAtual
        );
    }

    const entradasMes = entradas.filter(
        pertenceMesAtual
    );

    const saidasMes = saidas.filter(
        pertenceMesAtual
    );

    const mensalidadesPagasMes = mensalidades.filter(
        mensalidadePagaNoMesAtual
    );

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
    );

    const entradasRecorrentesMes =
        recorrenciasAtivas
            .filter(item => item.tipo === "entrada")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

    const saidasRecorrentesMes =
        recorrenciasAtivas
            .filter(item => item.tipo === "saida")
            .reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

    const totalMensalidadesPagas =
        mensalidadesPagasMes.reduce(
            (soma, item) =>
                soma + Number(item.valor || 0),
            0
        );

    const totalEntradasManuais =
        entradasMes.reduce(
            (soma, item) =>
                soma + Number(item.valor || 0),
            0
        );

    const totalSaidasManuais =
        saidasMes.reduce(
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

    const mensalidadesParaLista =
        mensalidadesPagasMes.map(item => ({
            id: item.id,
            data: item.data_pagamento,
            tipo: "Mensalidade",
            descricao: `Mensalidade - ${item.aluno}`,
            valor: Number(item.valor || 0)
        }));

    const ultimos = [
        ...entradasMes.map(item => ({
            ...item,
            tipo: "Entrada"
        })),

        ...saidasMes.map(item => ({
            ...item,
            tipo: "Saída"
        })),

        ...mensalidadesParaLista
    ]
        .sort((a, b) =>
            b.data.localeCompare(a.data)
        )
        .slice(0, 10);

    document.getElementById("app").innerHTML = `
        <div class="cards">

            <div class="card verde">
                <span>Saldo</span>
                <strong>${moeda(saldo)}</strong>
            </div>

            <div class="card azul">
                <span>Entradas do mês</span>
                <strong>${moeda(totalEntradas)}</strong>
            </div>

            <div class="card laranja">
                <span>Saídas do mês</span>
                <strong>${moeda(totalSaidas)}</strong>
            </div>

            <div class="card vermelho">
                <span>Mensalidades pagas</span>
                <strong>${moeda(totalMensalidadesPagas)}</strong>
            </div>

        </div>

        <div class="painel">
            <h2>Resumo das entradas do mês</h2>

            <table class="table">
                <thead>
                    <tr>
                        <th>Origem</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>Entradas manuais</td>
                        <td>
                            ${moeda(totalEntradasManuais)}
                        </td>
                    </tr>

                    <tr>
                        <td>Entradas recorrentes</td>
                        <td>
                            ${moeda(entradasRecorrentesMes)}
                        </td>
                    </tr>

                    <tr>
                        <td>Mensalidades pagas</td>
                        <td>
                            ${moeda(totalMensalidadesPagas)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="painel">
            <h2>Resumo das saídas do mês</h2>

            <table class="table">
                <thead>
                    <tr>
                        <th>Origem</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>Saídas manuais</td>
                        <td>
                            ${moeda(totalSaidasManuais)}
                        </td>
                    </tr>

                    <tr>
                        <td>Saídas recorrentes</td>
                        <td>
                            ${moeda(saidasRecorrentesMes)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="painel">
            <h2>Últimos lançamentos do mês</h2>

            ${
                ultimos.length
                    ? `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${ultimos.map(item => `
                                    <tr>
                                        <td>
                                            ${dataBR(item.data)}
                                        </td>

                                        <td>
                                            ${item.tipo}
                                        </td>

                                        <td>
                                            ${escapeHtml(
                                                item.descricao
                                            )}
                                        </td>

                                        <td>
                                            ${moeda(item.valor)}
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    `
                    : `
                        <p class="msg">
                            Nenhum lançamento cadastrado neste mês.
                        </p>
                    `
            }
        </div>
    `;
}
