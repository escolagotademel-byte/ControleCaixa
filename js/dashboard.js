async function renderDashboard() {
    setTitulo('Controle de Caixa', 'Resumo financeiro da escola');

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const [entradas, saidas, recorrencias, saldoInicialRaw] = await Promise.all([
        buscar('entradas'),
        buscar('saidas'),
        buscar('recorrencias'),
        buscarConfig('saldoInicial')
    ]);

    const saldoInicial = Number(saldoInicialRaw || 0);

    function pertenceMesAtual(item) {
        const data = new Date(item.data + 'T00:00:00');
        return data.getFullYear() === anoAtual && data.getMonth() === mesAtual;
    }

    const entradasMes = entradas.filter(pertenceMesAtual);
    const saidasMes = saidas.filter(pertenceMesAtual);

    const recorrenciasAtivas = recorrencias.filter(r => r.ativo !== false);

    const entradasRecorrentesMes = recorrenciasAtivas
        .filter(r => r.tipo === 'entrada')
        .reduce((soma, item) => soma + Number(item.valor), 0);

    const saidasRecorrentesMes = recorrenciasAtivas
        .filter(r => r.tipo === 'saida')
        .reduce((soma, item) => soma + Number(item.valor), 0);

    const totalEntradas =
        entradasMes.reduce((soma, item) => soma + Number(item.valor), 0)
        + entradasRecorrentesMes;

    const totalSaidas =
        saidasMes.reduce((soma, item) => soma + Number(item.valor), 0)
        + saidasRecorrentesMes;

    const saldo = saldoInicial + totalEntradas - totalSaidas;

    const ultimos = [
        ...entradasMes.map(e => ({ ...e, tipo: 'Entrada' })),
        ...saidasMes.map(s => ({ ...s, tipo: 'Saída' }))
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
            <h2>Resumo das recorrências do mês</h2>

            <table class="table">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Entradas recorrentes</td>
                        <td>${moeda(entradasRecorrentesMes)}</td>
                    </tr>
                    <tr>
                        <td>Saídas recorrentes</td>
                        <td>${moeda(saidasRecorrentesMes)}</td>
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
                            ${ultimos.map(i => `
                                <tr>
                                    <td>${dataBR(i.data)}</td>
                                    <td>${i.tipo}</td>
                                    <td>${escapeHtml(i.descricao)}</td>
                                    <td>${moeda(i.valor)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `
                : '<p class="msg">Nenhum lançamento manual cadastrado neste mês.</p>'
            }
        </div>
    `;
}
