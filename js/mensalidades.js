let mensalidadeEditando = null;

async function renderMensalidades() {
    setTitulo(
        'Mensalidades',
        'Controle as mensalidades previstas, pagas e pendentes'
    );

    const mesAtual = new Date().toISOString().slice(0, 7);

    document.getElementById('app').innerHTML = `
        <div class="painel">
            <div class="toolbar">
                <input
                    id="buscaMensalidade"
                    placeholder="Pesquisar aluno..."
                    oninput="listarMensalidades()"
                >

                <input
                    type="month"
                    id="filtroCompetencia"
                    value="${mesAtual}"
                    onchange="listarMensalidades()"
                >

                <select
                    id="filtroStatusMensalidade"
                    onchange="listarMensalidades()"
                >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Pagos</option>
                </select>

                <button
                    class="btn blue"
                    onclick="abrirFormMensalidade()"
                >
                    + Nova Mensalidade
                </button>
            </div>

            <div id="formMensalidade"></div>
            <div id="resumoMensalidades"></div>
            <div id="listaMensalidades"></div>
        </div>
    `;

    await listarMensalidades();
}

function abrirFormMensalidade(item = null) {
    mensalidadeEditando = item;

    const competenciaPadrao =
        item?.competencia?.slice(0, 7)
        || new Date().toISOString().slice(0, 7);

    const diaVencimento =
        item?.vencimento
        ? Number(item.vencimento.slice(8, 10))
        : 10;

    document.getElementById('formMensalidade').innerHTML = `
        <div class="form">
            <div class="field">
                <label>Nome do aluno</label>
                <input
                    id="mensalidadeAluno"
                    value="${escapeHtml(item?.aluno || '')}"
                    placeholder="Ex: João da Silva"
                >
            </div>

            <div class="field">
                <label>Valor</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="mensalidadeValor"
                    value="${item?.valor || ''}"
                    placeholder="0,00"
                >
            </div>

            <div class="field">
                <label>Primeira competência</label>
                <input
                    type="month"
                    id="mensalidadeCompetencia"
                    value="${competenciaPadrao}"
                >
            </div>

            <div class="field">
                <label>Dia do vencimento</label>
                <input
                    type="number"
                    min="1"
                    max="28"
                    id="mensalidadeDiaVencimento"
                    value="${diaVencimento}"
                >
            </div>

            ${
                item
                ? ''
                : `
                    <div class="field">
                        <label>Quantidade de meses</label>
                        <input
                            type="number"
                            min="1"
                            max="24"
                            id="mensalidadeQuantidadeMeses"
                            value="12"
                        >
                    </div>
                `
            }

            <button
                class="btn green"
                onclick="salvarMensalidade()"
            >
                ${item ? 'Salvar alterações' : 'Cadastrar mensalidades'}
            </button>

            <button
                class="btn"
                onclick="fecharFormMensalidade()"
            >
                Cancelar
            </button>
        </div>
    `;
}

function fecharFormMensalidade() {
    mensalidadeEditando = null;
    document.getElementById('formMensalidade').innerHTML = '';
}

function montarDataMensalidade(competencia, dia) {
    const [ano, mes] = competencia.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const diaValido = Math.min(Number(dia), ultimoDia);

    return `${ano}-${String(mes).padStart(2, '0')}-${String(diaValido).padStart(2, '0')}`;
}

async function salvarMensalidade() {
    const aluno = document
        .getElementById('mensalidadeAluno')
        .value
        .trim();

    const valor = Number(
        document.getElementById('mensalidadeValor').value
    );

    const competencia = document
        .getElementById('mensalidadeCompetencia')
        .value;

    const diaVencimento = Number(
        document.getElementById('mensalidadeDiaVencimento').value
    );

    if (
        !aluno
        || !valor
        || !competencia
        || diaVencimento < 1
        || diaVencimento > 28
    ) {
        alert('Preencha aluno, valor, competência e dia do vencimento.');
        return;
    }

    if (mensalidadeEditando) {
        const obj = {
            aluno,
            valor,
            competencia: `${competencia}-01`,
            vencimento: montarDataMensalidade(
                competencia,
                diaVencimento
            )
        };

        await atualizar(
            'mensalidades',
            mensalidadeEditando.id,
            obj
        );
    } else {
        const quantidadeMeses = Number(
            document.getElementById(
                'mensalidadeQuantidadeMeses'
            ).value
        );

        if (
            quantidadeMeses < 1
            || quantidadeMeses > 24
        ) {
            alert('Informe uma quantidade entre 1 e 24 meses.');
            return;
        }

        const [anoInicial, mesInicial] =
            competencia.split('-').map(Number);

        const registros = [];

        for (
            let indice = 0;
            indice < quantidadeMeses;
            indice++
        ) {
            const dataMes = new Date(
                anoInicial,
                mesInicial - 1 + indice,
                1
            );

            const chaveCompetencia =
                `${dataMes.getFullYear()}-`
                + `${String(
                    dataMes.getMonth() + 1
                ).padStart(2, '0')}`;

            registros.push({
                aluno,
                valor,
                competencia: `${chaveCompetencia}-01`,
                vencimento: montarDataMensalidade(
                    chaveCompetencia,
                    diaVencimento
                ),
                pago: false,
                data_pagamento: null
            });
        }

        const { error } = await supabaseClient
            .from('mensalidades')
            .insert(registros);

        if (error) {
            throw error;
        }
    }

    fecharFormMensalidade();
    await listarMensalidades();
}

async function listarMensalidades() {
    const busca = (
        document.getElementById('buscaMensalidade')
            ?.value
        || ''
    ).toLowerCase();

    const competencia = document.getElementById(
        'filtroCompetencia'
    )?.value;

    const status = document.getElementById(
        'filtroStatusMensalidade'
    )?.value || 'todos';

    let itens = await buscar('mensalidades');

    itens = itens.filter(item => {
        const correspondeAluno =
            item.aluno.toLowerCase().includes(busca);

        const correspondeCompetencia =
            !competencia
            || item.competencia.slice(0, 7)
                === competencia;

        const correspondeStatus =
            status === 'todos'
            || (
                status === 'pago'
                && item.pago === true
            )
            || (
                status === 'pendente'
                && item.pago !== true
            );

        return (
            correspondeAluno
            && correspondeCompetencia
            && correspondeStatus
        );
    });

    const totalPrevisto = itens.reduce(
        (soma, item) => soma + Number(item.valor),
        0
    );

    const totalPago = itens
        .filter(item => item.pago === true)
        .reduce(
            (soma, item) => soma + Number(item.valor),
            0
        );

    const totalPendente = totalPrevisto - totalPago;

    document.getElementById(
        'resumoMensalidades'
    ).innerHTML = `
        <div class="cards">
            <div class="card azul">
                <span>Previsto</span>
                <strong>${moeda(totalPrevisto)}</strong>
            </div>

            <div class="card verde">
                <span>Pago</span>
                <strong>${moeda(totalPago)}</strong>
            </div>

            <div class="card laranja">
                <span>Pendente</span>
                <strong>${moeda(totalPendente)}</strong>
            </div>
        </div>
    `;

    document.getElementById(
        'listaMensalidades'
    ).innerHTML = itens.length
        ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Competência</th>
                        <th>Vencimento</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Pagamento</th>
                        <th>Ações</th>
                    </tr>
                </thead>

                <tbody>
                    ${itens.map(item => `
                        <tr>
                            <td>${escapeHtml(item.aluno)}</td>

                            <td>
                                ${nomeMes(
                                    item.competencia.slice(0, 7)
                                )}
                            </td>

                            <td>${dataBR(item.vencimento)}</td>

                            <td>${moeda(item.valor)}</td>

                            <td>
                                ${
                                    item.pago
                                    ? '✅ Pago'
                                    : '⏳ Pendente'
                                }
                            </td>

                            <td>
                                ${
                                    item.data_pagamento
                                    ? dataBR(item.data_pagamento)
                                    : '-'
                                }
                            </td>

                            <td>
                                <div class="actions">
                                    ${
                                        item.pago
                                        ? `
                                            <button
                                                class="btn laranja"
                                                onclick="desfazerPagamentoMensalidade(${item.id})"
                                            >
                                                Desfazer pagamento
                                            </button>
                                        `
                                        : `
                                            <button
                                                class="btn green"
                                                onclick="marcarMensalidadePaga(${item.id})"
                                            >
                                                Marcar como pago
                                            </button>
                                        `
                                    }

                                    <button
                                        class="btn blue"
                                        onclick='abrirFormMensalidade(${JSON.stringify(item)})'
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="btn red"
                                        onclick="excluirMensalidade(${item.id})"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `
        : `
            <p class="msg">
                Nenhuma mensalidade encontrada.
            </p>
        `;
}

async function marcarMensalidadePaga(id) {
    const confirmar = confirm(
        'Confirmar o recebimento desta mensalidade?'
    );

    if (!confirmar) {
        return;
    }

    await atualizar('mensalidades', id, {
        pago: true,
        data_pagamento: hojeISO()
    });

    await listarMensalidades();
}

async function desfazerPagamentoMensalidade(id) {
    const confirmar = confirm(
        'Deseja desfazer o pagamento desta mensalidade?'
    );

    if (!confirmar) {
        return;
    }

    await atualizar('mensalidades', id, {
        pago: false,
        data_pagamento: null
    });

    await listarMensalidades();
}

async function excluirMensalidade(id) {
    const confirmar = confirm(
        'Excluir esta mensalidade? Somente este mês será excluído.'
    );

    if (!confirmar) {
        return;
    }

    await remover('mensalidades', id);
    await listarMensalidades();
}
