document.addEventListener('DOMContentLoaded', function() {
    initExampleTabs();
    initAudioPlayers();
});

// Example section tab switching
function initExampleTabs() {
    const tabBtns = document.querySelectorAll('.ex-tab-btn');
    const grids = document.querySelectorAll('.example-grid');
    
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-ex-tab');
            
            // Update active button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding grid
            grids.forEach(grid => {
                grid.classList.remove('active');
                if (grid.id === tabId) {
                    grid.classList.add('active');
                }
            });
        });
    });
}

// Global controller, disable multiple audios playing simultaneously.
function initAudioPlayers() {
    const audios = document.querySelectorAll('audio');
    
    audios.forEach(audio => {
        audio.addEventListener('play', function() {
            audios.forEach(otherAudio => {
                if (otherAudio !== this) {
                    otherAudio.pause();
                    otherAudio.currentTime = 0;
                }
            });
        });
    });
}