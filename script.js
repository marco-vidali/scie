/* ==========================================================================
   THEME TOGGLER & SETUP
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initSectionNavigation();
    initAccordions();
    initSearch();
    initQuiz();
    
    // Initial simulator setups
    selectOperon('lac');
    selectBoundary('divergent');
    updateOverallProgress();
});

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            localStorage.setItem('theme', 'light');
        }
    }
}

/* ==========================================================================
   SIDEBAR & RESPONSIVENESS
   ========================================================================== */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose = document.getElementById('sidebarClose');

    sidebarOpen.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarOpen.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
}

/* ==========================================================================
   SECTION NAVIGATION & PROGRESS
   ========================================================================== */
function initSectionNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.topic-section');
    const scrollArea = document.querySelector('.content-scroll-area');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            // Toggle active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show active section
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active-section');
                } else {
                    sec.classList.remove('active-section');
                }
            });

            // Close sidebar on mobile after clicking
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }

            // Scroll content area back to top
            scrollArea.scrollTop = 0;
            
            // Re-run search matching on target section
            runSearchFilter();
        });
    });
}

// Track quiz completion to calculate study progress
const completedQuizzes = new Set();

function updateOverallProgress() {
    const totalQuizzes = document.querySelectorAll('.quiz-card').length;
    const completedCount = completedQuizzes.size;
    const percentage = totalQuizzes > 0 ? Math.round((completedCount / totalQuizzes) * 100) : 0;
    
    document.getElementById('overallProgress').innerText = `${percentage}%`;
    document.getElementById('overallProgressFill').style.width = `${percentage}%`;
}

/* ==========================================================================
   ACCORDIONS
   ========================================================================== */
function initAccordions() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.closest('.accordion-item');
            const isOpen = item.classList.contains('open');
            
            // Close other items in the same accordion
            const siblingItems = item.closest('.accordion').querySelectorAll('.accordion-item');
            siblingItems.forEach(sib => sib.classList.remove('open'));
            
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}

/* ==========================================================================
   SEARCH SYSTEM
   ========================================================================== */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        runSearchFilter();
    });
}

function runSearchFilter() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const activeSection = document.querySelector('.topic-section.active-section');
    if (!activeSection) return;

    const cards = activeSection.querySelectorAll('.info-card');
    
    // Clear previous highlights
    removeTextHighlights(activeSection);

    if (query === "") {
        // Show all cards and return
        cards.forEach(card => {
            card.style.display = 'flex';
        });
        return;
    }

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
            card.style.display = 'flex';
            // Highlight occurrences inside the card
            highlightMatches(card, query);
        } else {
            // Hide card if it doesn't match
            card.style.display = 'none';
        }
    });
}

function highlightMatches(element, query) {
    // Avoid highlighting inside tags, style sheets or scripts
    const textNodes = [];
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while(node = walk.nextNode()) {
        if (node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE' && !node.parentElement.classList.contains('option-btn')) {
            textNodes.push(node);
        }
    }

    textNodes.forEach(node => {
        const text = node.nodeValue;
        const lowerText = text.toLowerCase();
        let index = lowerText.indexOf(query);
        
        if (index >= 0) {
            const parent = node.parentNode;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            
            while (index >= 0) {
                // Add text before match
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
                
                // Add highlighted match
                const mark = document.createElement('mark');
                mark.className = 'text-match';
                mark.appendChild(document.createTextNode(text.substring(index, index + query.length)));
                fragment.appendChild(mark);
                
                lastIndex = index + query.length;
                index = lowerText.indexOf(query, lastIndex);
            }
            
            // Add remaining text
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            parent.replaceChild(fragment, node);
        }
    });
}

function removeTextHighlights(section) {
    const marks = section.querySelectorAll('mark.text-match');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); // merge adjacent text nodes
    });
}

/* ==========================================================================
   QUIZ ENGINE
   ========================================================================== */
function initQuiz() {
    const quizCards = document.querySelectorAll('.quiz-card');
    
    quizCards.forEach(card => {
        const quizId = card.getAttribute('data-quiz');
        const options = card.querySelectorAll('.option-btn');
        const feedback = card.querySelector('.quiz-feedback');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove existing selection classes from this card
                options.forEach(opt => {
                    opt.classList.remove('correct-ans', 'wrong-ans');
                    opt.disabled = true; // disable further answering
                });
                
                const isCorrect = option.getAttribute('data-correct') === 'true';
                
                if (isCorrect) {
                    option.classList.add('correct-ans');
                    feedback.className = 'quiz-feedback success';
                    feedback.innerText = "Corretto! Ottimo lavoro, hai compreso questo concetto.";
                    completedQuizzes.add(quizId);
                } else {
                    option.classList.add('wrong-ans');
                    
                    // Highlight the correct answer as well
                    const correctOpt = card.querySelector('.option-btn[data-correct="true"]');
                    if (correctOpt) correctOpt.classList.add('correct-ans');
                    
                    feedback.className = 'quiz-feedback error';
                    feedback.innerText = "Errato. Rileggi gli schemi sopra e prova a capire perché.";
                }
                
                feedback.classList.remove('hidden');
                updateOverallProgress();
            });
        });
    });
}

/* ==========================================================================
   SIMULATOR: ISOMERISM EXPLORER (Topic 1)
   ========================================================================== */
function showIsomer(type) {
    const display = document.getElementById('isomerDisplay');
    const tabs = document.querySelectorAll('#chimica-organica .v-tab');
    
    // Toggle tab active class
    tabs.forEach(tab => {
        if (tab.innerText.toLowerCase().includes(type.substring(0, 4))) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    let html = "";
    if (type === 'struttura') {
        html = `
            <div class="isomer-box">
                <strong>Butano (lineare) vs Isobutano (ramificato)</strong>
                <div class="formula-render">
                    <span>CH₃-CH₂-CH₂-CH₃</span>
                    <span class="vs-divider">VS</span>
                    <span>CH₃-CH(CH₃)-CH₃</span>
                </div>
                <p class="description">Entrambi hanno formula molecolare C₄H₁₀. Il butano ha una catena lineare con forze di van der Waals maggiori (ebolle a -0.5°C), mentre l'isobutano è ramificato con molecola più compatta e forze minori (ebolle a -11.7°C).</p>
            </div>
        `;
    } else if (type === 'geometrica') {
        html = `
            <div class="isomer-box">
                <strong>cis-2-butene vs trans-2-butene</strong>
                <div class="formula-render">
                    <span>cis: CH₃-C=C-CH₃ (sost. stesso lato)</span>
                    <span class="vs-divider">VS</span>
                    <span>trans: CH₃-C=C-CH₃ (lati opposti)</span>
                </div>
                <p class="description">A causa dell'impossibilità di rotazione del doppio legame carbonio-carbonio (sp²), si formano due stereoisomeri geometrici distinti. L'isomero cis è debolmente polare, mentre l'isomero trans ha dipolo nullo per via della simmetria molecolare.</p>
            </div>
        `;
    } else if (type === 'enantiomero') {
        html = `
            <div class="isomer-box">
                <strong>D-Acido Lattico vs L-Acido Lattico</strong>
                <div class="formula-render">
                    <span>D-Forma: Immagine speculare destrogira</span>
                    <span class="vs-divider">VS</span>
                    <span>L-Forma: Immagine speculare levogira</span>
                </div>
                <p class="description">Molecole speculari non sovrapponibili. Contengono uno stereocentro (carbonio-2, legato a -H, -OH, -COOH, -CH₃). Hanno proprietà fisiche identiche (densità, ebollizione), ma ruotano la luce polarizzata in direzioni opposte e differiscono significativamente nell'attività biologica recettoriale.</p>
            </div>
        `;
    }
    
    display.innerHTML = html;
}

/* ==========================================================================
   SIMULATOR: OPERON (Topic 9)
   ========================================================================== */
let currentOperon = 'lac';
let envActive = false;

function selectOperon(type) {
    currentOperon = type;
    
    // Toggle active state on buttons
    document.getElementById('selectLac').className = type === 'lac' ? 'sim-btn active' : 'sim-btn';
    document.getElementById('selectTrp').className = type === 'trp' ? 'sim-btn active' : 'sim-btn';
    
    const label = document.getElementById('envFactorLabel');
    const checkbox = document.getElementById('envFactor');
    
    if (type === 'lac') {
        label.innerText = 'Presenza Lattosio';
        checkbox.checked = false;
        envActive = false;
    } else {
        label.innerText = 'Presenza Triptofano';
        checkbox.checked = false;
        envActive = false;
    }
    
    updateOperonState();
}

function toggleEnvFactor() {
    envActive = document.getElementById('envFactor').checked;
    updateOperonState();
}

function updateOperonState() {
    const operator = document.getElementById('simOperator');
    const repressor = document.getElementById('simRepressor');
    const rnaPoly = document.getElementById('simRnaPoly');
    const status = document.getElementById('simStatus');
    
    if (currentOperon === 'lac') {
        if (envActive) {
            // Lactose present -> Repressor detached -> Transcription active
            repressor.classList.remove('bound');
            repressor.style.transform = 'translateY(40px)';
            repressor.innerText = 'Inattivo (con Allolattosio)';
            
            rnaPoly.classList.add('transcribing');
            rnaPoly.style.transform = 'translateX(280px)';
            
            operator.style.backgroundColor = 'hsl(140, 70%, 40%)';
            status.innerText = 'Lattosio presente: l\'allolattosio si lega al repressore rendendolo inattivo. Il repressore si stacca dall\'operatore. La trascrizione è ATTIVA.';
            status.style.color = 'var(--color-success)';
        } else {
            // Lactose absent -> Repressor bound -> Transcription blocked
            repressor.classList.add('bound');
            repressor.style.transform = 'translateY(0)';
            repressor.innerText = 'Repressore';
            
            rnaPoly.classList.remove('transcribing');
            rnaPoly.style.transform = 'translateX(0)';
            
            operator.style.backgroundColor = 'hsl(15, 80%, 45%)';
            status.innerText = 'Lattosio assente: il repressore attivo si lega all\'operatore sbarrando la strada. L\'RNA polimerasi è bloccata. La trascrizione è SPENTA.';
            status.style.color = 'var(--color-error)';
        }
    } else if (currentOperon === 'trp') {
        if (envActive) {
            // Tryptophan present -> Repressor active & bound -> Transcription blocked
            repressor.classList.add('bound');
            repressor.style.transform = 'translateY(0)';
            repressor.innerText = 'Attivo (con Triptofano)';
            
            rnaPoly.classList.remove('transcribing');
            rnaPoly.style.transform = 'translateX(0)';
            
            operator.style.backgroundColor = 'hsl(15, 80%, 45%)';
            status.innerText = 'Triptofano presente: agisce come co-repressore attivando il repressore, che si lega all\'operatore. L\'RNA polimerasi è bloccata. La trascrizione è SPENTA.';
            status.style.color = 'var(--color-error)';
        } else {
            // Tryptophan absent -> Repressor inactive -> Transcription active
            repressor.classList.remove('bound');
            repressor.style.transform = 'translateY(40px)';
            repressor.innerText = 'Inattivo';
            
            rnaPoly.classList.add('transcribing');
            rnaPoly.style.transform = 'translateX(280px)';
            
            operator.style.backgroundColor = 'hsl(140, 70%, 40%)';
            status.innerText = 'Triptofano assente: il repressore è inattivo e non può legarsi all\'operatore. L\'RNA polimerasi trascrive liberamente. La trascrizione è ATTIVA.';
            status.style.color = 'var(--color-success)';
        }
    }
}

/* ==========================================================================
   SIMULATOR: TECTONIC BOUNDARIES (Topic 13)
   ========================================================================== */
function selectBoundary(type) {
    const visualizer = document.getElementById('tectonicsVisualizer');
    const buttons = document.querySelectorAll('#geologia .sim-btn');
    const status = document.getElementById('boundaryStatus');
    const plateL = document.getElementById('plateL');
    const plateR = document.getElementById('plateR');
    
    // Toggle active state on buttons
    buttons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes(type.substring(0, 4))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset visualizer classes
    visualizer.classList.remove('divergent', 'subduction', 'collision');
    visualizer.classList.add(type);
    
    if (type === 'divergent') {
        plateL.innerText = 'Placca Oceanica A';
        plateR.innerText = 'Placca Oceanica B';
        status.innerText = 'Margine Divergente (costruttivo): Le placche litosferiche si allontanano. La decompression fa fondere parzialmente la peridotite del mantello, il magma risale nella rift valley creando nuova crosta basaltica (es. Dorsali medio-oceaniche, Rift Valley africana).';
    } else if (type === 'subduction') {
        plateL.innerText = 'Placca Oceanica (densa)';
        plateR.innerText = 'Placca Continentale';
        status.innerText = 'Margine Convergente - Subduzione (distruttivo): La placca oceanica più densa e fredda sprofonda sotto la continentale. Si forma una fossa oceanica profonda, terremoti allineati sul piano di Benioff, e risalita di magma andesitico che genera un arco vulcanico continentale (es. Catena delle Ande).';
    } else if (type === 'collision') {
        plateL.innerText = 'Continente A';
        plateR.innerText = 'Continente B';
        status.innerText = 'Margine Convergente - Collisione: Due placche continentali di uguale densità collidono. Nessuna sprofonda in subduzione; la crosta si frantuma, si accavalla in scaglie tettoniche e si raddoppia in spessore, portando all\'orogenesi di catene montuose alpine (es. Himalaya, Alpi).';
    }
}
