// --- Feature: Aleatoriedade e Atualização Visual ---
function embaralharBlocos() {
    const origin = document.getElementById('origin');
    const blocksArray = Array.from(origin.querySelectorAll('.block'));
    
    blocksArray.sort(() => Math.random() - 0.5);
    blocksArray.forEach(block => origin.appendChild(block));
}

// Verifica se um container tem itens dentro para aplicar a quebra de linha (separar tags)
function updateContainers() {
    document.querySelectorAll('.container').forEach(container => {
        // Ignora .tag-open e .tag-close, procura apenas por filhos que sejam blocos
        const hasBlock = [...container.children].some(child => child.classList.contains('block'));
        if (hasBlock) {
            container.classList.add('expanded');
        } else {
            container.classList.remove('expanded');
        }
    });
}

embaralharBlocos();
updateContainers();

// --- Lógica de Drag and Drop ---
const blocks = document.querySelectorAll('.block');
let draggedBlock = null;

// Helper: Retorna o alvo válido para o Drop. 
// Regra Nova: Se estiver em cima de algo dentro do #origin, força o alvo a ser o #origin (impede aninhamento na origem).
function getValidTarget(element) {
    let target = element.closest('.main-dropzone, .container, #origin');
    if (target && target.closest('#origin')) {
        return document.getElementById('origin');
    }
    return target;
}

blocks.forEach(block => {
    block.addEventListener('dragstart', (e) => {
        draggedBlock = block;
        e.dataTransfer.setData('text/plain', block.id);
        setTimeout(() => block.style.opacity = '0.5', 0);
        e.stopPropagation(); 
    });

    block.addEventListener('dragend', () => {
        if(draggedBlock) draggedBlock.style.opacity = '1';
        draggedBlock = null;
        document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
        updateContainers(); // Atualiza layout das tags após mover
    });
});

document.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const target = getValidTarget(e.target);
    if (target && target !== draggedBlock) {
        target.classList.add('drop-hover');
    }
});

document.addEventListener('dragleave', (e) => {
    const target = getValidTarget(e.target);
    if (target) {
        target.classList.remove('drop-hover');
    }
});

// --- Lógica Principal de Soltar ---
document.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = getValidTarget(e.target);

    if (target && draggedBlock) {
        document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
        
        // Impede loop infinito
        if (draggedBlock.contains(target)) return;

        const afterElement = getDragAfterElement(target, e.clientY);
        
        if (afterElement == null) {
            // Regra Nova: Se for um container, insere ANTES da tag de fechamento (</tag>)
            const closeTag = target.querySelector(':scope > .tag-close');
            if (closeTag && target.classList.contains('container')) {
                target.insertBefore(draggedBlock, closeTag);
            } else {
                target.appendChild(draggedBlock); // Se não for container (ou #origin), vai pro fim
            }
        } else {
            target.insertBefore(draggedBlock, afterElement); // Insere no meio de outros blocos
        }
        
        updateContainers(); // Verifica quem quebrou a linha
        visualFeedback(draggedBlock);
    }
});

// Acha a posição baseada no eixo Y
function getDragAfterElement(container, y) {
    const draggableElements = [...container.children].filter(c => c.classList.contains('block') && c !== draggedBlock);

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function visualFeedback(el) {
    el.style.boxShadow = "0 0 15px var(--orange)";
    setTimeout(() => el.style.boxShadow = "none", 500);
}