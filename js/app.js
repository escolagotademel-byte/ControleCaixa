async function renderDashboard() {
    setTitulo(
        'Controle Financeiro',
        'Resumo financeiro pessoal'
    );

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const [
        entradas,
        saidas,
        recorrencias,
        saldoInicialRaw
    ] = await Promise.all([
        buscar('entradas'),
        buscar('saidas'),
        buscar('recorrencias'),
        buscarConfig('saldoInicial')
    ]);

    const saldoInicial = Number(saldoInicialRaw || 0);

    function dataNoMesAtual(dataTexto) {
        if (!dataTexto) {
            return false;
        }

        const data = new Date(`${dataTexto}T00:00:00`);

        return (
            data.getFullYear() === anoAtual
            && data.getMonth() === mesAtual
        );
    }

    const entradasMes = entradas.filter(
        item => dataNoMesAtual(item.data)
    );

    const saidasMes = saidas.filter(
        item => dataNoMesAtual(item.data)
    );

    const recorrenciasAtivas = recorrencias.filter(
        item => item.ativo !== false
    );

    const entradasRecorrentes = recorrenciasAtivas
        .filter(item => item.tipo === 'entrada')
        .reduce(
            (soma, item) => soma + Number(item.valor),
            0
        );

    const saidasRecorrentes = recorrenciasAtivas
        .filter(item => item.tipo === 'saida')
        .reduce(
            (soma, item) => soma + Number(item.valor),
            0
        );

    const entradasManuais = entradasMes.reduce(
        (soma, item) => soma + Number(item.valor),
        0
    );

    const saidasManuais = saidasMes.reduce(
        (soma, item) => soma + Number(item.valor),
        0
    );

    const totalEntradas =
        entradasManuais + entradasRecorrentes;

    const totalSaidas =
        saidasManuais + saidasRecorrentes;

    const saldo =
        saldoInicial + totalEntradas - totalSaidas;

    const ultimosLancamentos = [
        ...entradasMes.map(item => ({
            data: item.data,
            tipo: 'Entrada',
            descricao: item.descricao,
            valor: Number(item.valor)
        })),

        ...saidasMes.map(item => ({
            data: item.data,
            tipo: 'Saída',
            descricao: item.descricao,
            valor: Number(item.valor)
        }))
    ]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 10);

    document.getElementById('app').innerHTML = `
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
                <span>Saldo Inicial</span>
                <strong>${moeda(saldoInicial)}</strong>
            </div>
        </div>

        <div class="painel">
            <h2>Últimos lançamentos do mês</h2>

            ${
                ultimosLancamentos.length
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
                                ${ultimosLancamentos.map(item => `
                                    <tr>
                                        <td>${dataBR(item.data)}</td>
                                        <td>${item.tipo}</td>
                                        <td>${escapeHtml(item.descricao)}</td>
                                        <td>${moeda(item.valor)}</td>
                                    </tr>
                                `).join('')}
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
