/**
 * Presentation Controller
 * Handles slide navigation, animations, fullscreen, and user interactions
 */
document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // Presentation State
    // ============================================
    let currentSlide = 1;
    const totalSlides = 14;

    // Click-reveal state: tracks which element index to show next per slide
    const clickRevealState = {};

    // ============================================
    // DOM Element References
    // ============================================
    const slides = document.querySelectorAll('.slide');
    const slidesContainer = document.querySelector('.slides-container');
    const progressBar = document.getElementById('progressBar');
    const currentSlideEl = document.getElementById('currentSlide');
    const totalSlidesEl = document.getElementById('totalSlides');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const keyboardHint = document.getElementById('keyboardHint');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const exitFullscreenIcon = document.getElementById('exitFullscreenIcon');

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the presentation
     * Sets up initial state and triggers first slide animation
     */
    function init() {
        totalSlidesEl.textContent = totalSlides;
        updateProgress();
        updateNavButtons();

        // Preload animations - reset all animatable elements
        preloadAnimations();

        // Initial animation for first slide
        setTimeout(() => {
            const firstSlide = document.querySelector('.slide.active');
            animateSlide(firstSlide);
        }, 500);
    }

    // ============================================
    // Slide Navigation Functions
    // ============================================

    /**
     * Navigate to a specific slide by number
     * @param {number} slideNum - The slide number to navigate to (1-indexed)
     */
    function goToSlide(slideNum) {
        if (slideNum < 1 || slideNum > totalSlides) return;

        const previousSlide = currentSlide;
        const direction = slideNum > previousSlide ? 'next' : 'prev';

        // Set direction attribute on container for CSS transitions
        slidesContainer.setAttribute('data-direction', direction);

        // Get the current active slide for exit animation
        const exitingSlide = document.querySelector(`[data-slide="${previousSlide}"]`);

        // Add exiting class for smooth transition
        if (exitingSlide && previousSlide !== slideNum) {
            const exitClass = direction === 'next' ? 'exiting-left' : 'exiting-right';
            exitingSlide.classList.add(exitClass);

            // Remove exiting class after transition completes
            setTimeout(() => {
                exitingSlide.classList.remove(exitClass);
            }, 500);
        }

        // Remove active class from current slide
        slides.forEach(slide => slide.classList.remove('active'));

        // Add active class to new slide
        currentSlide = slideNum;
        const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
        activeSlide.classList.add('active');

        // Trigger animations for new slide
        setTimeout(() => animateSlide(activeSlide), 100);

        updateProgress();
        updateNavButtons();
    }

    /**
     * Navigate to the next slide
     */
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    /**
     * Navigate to the previous slide
     */
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    /**
     * Update the progress bar based on current slide position
     */
    function updateProgress() {
        const progress = ((currentSlide - 1) / (totalSlides - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        currentSlideEl.textContent = currentSlide;
    }

    /**
     * Update navigation button states (enable/disable)
     */
    function updateNavButtons() {
        prevBtn.disabled = currentSlide === 1;
        nextBtn.disabled = currentSlide === totalSlides;
    }

    // ============================================
    // Animation Functions
    // ============================================

    /**
     * Animate elements within a slide
     * Elements with data-delay attribute are animated sequentially
     * For click-reveal slides, elements are NOT animated automatically
     * @param {HTMLElement} slide - The slide element to animate
     */
    function animateSlide(slide) {
        // Check if this is a click-reveal slide
        const isClickReveal = slide.dataset.clickReveal === 'true';

        // Find all animatable elements
        const animatables = slide.querySelectorAll('[data-delay]');

        if (isClickReveal) {
            // For click-reveal slides, do NOT auto-animate
            // Just ensure the state is initialized
            const slideNum = parseInt(slide.dataset.slide);
            if (clickRevealState[slideNum] === undefined) {
                clickRevealState[slideNum] = 0;
            }
            return;
        }

        // Normal auto-animation for non-click-reveal slides
        animatables.forEach((el, index) => {
            const delay = parseInt(el.dataset.delay) || index;
            setTimeout(() => {
                el.classList.add('visible');
            }, delay * 150 + 100);
        });

        // Special animations for specific slides
        const slideNum = parseInt(slide.dataset.slide);

        // Reset animations when leaving slide
        slide.querySelectorAll('.visible').forEach(el => {
            if (!el.dataset.delay) return;
            // Keep visible state
        });
    }

    /**
     * Preload animations by resetting all animatable elements
     * Ensures clean animation state on page load
     */
    function preloadAnimations() {
        document.querySelectorAll('.slide').forEach(slide => {
            slide.querySelectorAll('[data-delay]').forEach(el => {
                el.classList.remove('visible');
            });
        });
    }

    // ============================================
    // Fullscreen Functionality
    // ============================================

    /**
     * Toggle fullscreen mode for the presentation
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Update fullscreen button icon based on current state
     */
    function updateFullscreenButton() {
        if (document.fullscreenElement) {
            fullscreenIcon.style.display = 'none';
            exitFullscreenIcon.style.display = 'block';
        } else {
            fullscreenIcon.style.display = 'block';
            exitFullscreenIcon.style.display = 'none';
        }
    }

    // ============================================
    // Keyboard Navigation
    // ============================================

    /**
     * Handle keyboard events for slide navigation
     * Supported keys:
     * - ArrowRight, ArrowDown, Space, PageDown: Next slide (or reveal next element)
     * - ArrowLeft, ArrowUp, PageUp: Previous slide
     * - Home: First slide
     * - End: Last slide
     * - F: Toggle fullscreen
     * @param {KeyboardEvent} e - The keyboard event
     */
    function handleKeydown(e) {
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                // For click-reveal slides, reveal next element first
                if (isCurrentSlideClickReveal() && !allElementsRevealed()) {
                    revealNextElement();
                } else {
                    nextSlide();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(1);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                // For click-reveal slides, hide last element (step backwards)
                if (isCurrentSlideClickReveal() && hideLastRevealedElement()) {
                    e.preventDefault();
                    updateClickRevealIndicator();
                }
                // Otherwise, Escape is handled by browser for fullscreen exit
                break;
        }
    }

    // ============================================
    // Click-Reveal Functions
    // ============================================

    /**
     * Check if the current slide is a click-reveal slide
     * @returns {boolean} True if current slide has click-reveal enabled
     */
    function isCurrentSlideClickReveal() {
        const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
        return activeSlide && activeSlide.dataset.clickReveal === 'true';
    }

    /**
     * Get animatable elements for a click-reveal slide
     * @param {HTMLElement} slide - The slide element
     * @returns {NodeList} List of elements with data-delay attribute
     */
    function getClickRevealElements(slide) {
        return slide.querySelectorAll('[data-delay]');
    }

    /**
     * Check if all elements on a click-reveal slide have been revealed
     * @returns {boolean} True if all elements are visible
     */
    function allElementsRevealed() {
        const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
        if (!activeSlide) return true;

        const elements = getClickRevealElements(activeSlide);
        const revealedCount = clickRevealState[currentSlide] || 0;

        return revealedCount >= elements.length;
    }

    /**
     * Reveal the next element on a click-reveal slide
     * @returns {boolean} True if an element was revealed, false if all are already visible
     */
    function revealNextElement() {
        const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
        if (!activeSlide) return false;

        const elements = getClickRevealElements(activeSlide);
        const currentIndex = clickRevealState[currentSlide] || 0;

        if (currentIndex >= elements.length) {
            return false; // All elements already revealed
        }

        // Find the element with data-delay matching currentIndex
        let elementToReveal = null;
        elements.forEach(el => {
            const delay = parseInt(el.dataset.delay);
            if (delay === currentIndex) {
                elementToReveal = el;
            }
        });

        if (elementToReveal) {
            elementToReveal.classList.add('visible');
        }

        clickRevealState[currentSlide] = currentIndex + 1;
        return true;
    }

    /**
     * Hide the last revealed element on the current slide (reverse reveal)
     * Used with Escape key to step backwards
     * @returns {boolean} True if an element was hidden, false otherwise
     */
    function hideLastRevealedElement() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide || activeSlide.dataset.clickReveal !== 'true') {
            return false;
        }

        const elements = activeSlide.querySelectorAll('[data-delay]');
        const currentIndex = clickRevealState[currentSlide] || 0;

        if (currentIndex <= 0) {
            return false; // No elements to hide
        }

        // Find the element with data-delay matching currentIndex - 1
        let elementToHide = null;
        elements.forEach(el => {
            const delay = parseInt(el.dataset.delay);
            if (delay === currentIndex - 1) {
                elementToHide = el;
            }
        });

        if (elementToHide) {
            elementToHide.classList.remove('visible');
        }

        clickRevealState[currentSlide] = currentIndex - 1;
        return true;
    }

    // ============================================
    // Click-Reveal Indicator
    // ============================================
    const clickRevealIndicator = document.getElementById('clickRevealIndicator');

    /**
     * Update click-reveal indicator visibility
     * Shows indicator when on a click-reveal slide with unrevealed elements
     */
    function updateClickRevealIndicator() {
        if (!clickRevealIndicator) return;

        if (isCurrentSlideClickReveal() && !allElementsRevealed()) {
            clickRevealIndicator.classList.add('visible');
        } else {
            clickRevealIndicator.classList.remove('visible');
        }
    }

    /**
     * Handle click on slides container for click-reveal slides
     */
    function handleSlideContainerClick(e) {
        // Only handle clicks on click-reveal slides
        if (!isCurrentSlideClickReveal()) return;

        // Don't handle if clicking on interactive elements
        if (e.target.closest('a, button, input, .fag-cell.clickable, .has-info')) return;

        // Reveal next element if available
        if (!allElementsRevealed()) {
            revealNextElement();
            updateClickRevealIndicator();
        }
    }

    // ============================================
    // Touch/Swipe Support
    // ============================================

    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Handle touch start event - record starting position
     * @param {TouchEvent} e - The touch event
     */
    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
    }

    /**
     * Handle touch end event - record ending position and process swipe
     * @param {TouchEvent} e - The touch event
     */
    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }

    /**
     * Process swipe gesture and navigate accordingly
     * Swipe left (negative diff) advances (or reveals next element), swipe right goes back
     */
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - advance or reveal
                if (isCurrentSlideClickReveal() && !allElementsRevealed()) {
                    revealNextElement();
                } else {
                    nextSlide();
                }
            } else {
                prevSlide();
            }
        }
    }

    // ============================================
    // Keyboard Hint Logic
    // ============================================

    /**
     * Show keyboard hint briefly after page load
     * Displays for 4 seconds after a 1 second delay
     */
    function showKeyboardHint() {
        setTimeout(() => {
            keyboardHint.classList.add('show');
            setTimeout(() => {
                keyboardHint.classList.remove('show');
            }, 4000);
        }, 1000);
    }

    // ============================================
    // Event Listeners
    // ============================================

    // Navigation button clicks
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Fullscreen
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);

    // Klikk på slides for click-reveal (kun på slides med data-click-reveal="true")
    slidesContainer.addEventListener('click', handleSlideContainerClick);

    // Touch/swipe support
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ============================================
    // Slide Menu (Hover Navigation)
    // ============================================

    /**
     * Initialize the slide menu hover navigation
     * Sets up click handlers for menu items and updates active state
     */
    function initSlideMenu() {
        const slideMenuItems = document.querySelectorAll('.slide-menu-item');

        slideMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const slideNum = parseInt(item.dataset.goto);
                if (slideNum >= 1 && slideNum <= totalSlides) {
                    goToSlide(slideNum);
                }
            });
        });

        // Set initial active state
        updateSlideMenuActive();
    }

    /**
     * Update the active state in the slide menu
     * Highlights the current slide in the menu
     */
    function updateSlideMenuActive() {
        const slideMenuItems = document.querySelectorAll('.slide-menu-item');
        slideMenuItems.forEach(item => {
            const slideNum = parseInt(item.dataset.goto);
            if (slideNum === currentSlide) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Initialize slide menu
    initSlideMenu();

    // ============================================
    // Parallax Effect
    // ============================================

    /**
     * Parallax configuration
     * Defines movement multipliers for different parallax speeds
     * Movement is in opposite direction of mouse (creates depth illusion)
     */
    const parallaxConfig = {
        slow: 0.3,    // Subtle movement - elements appear far away
        medium: 0.5,  // Standard movement
        fast: 0.8     // More movement - elements appear closer
    };

    /**
     * Maximum parallax movement in pixels
     * Keeps the effect subtle and prevents excessive displacement
     */
    const maxParallaxMovement = 25;

    /**
     * Handle mouse movement for parallax effect
     * Moves elements with data-parallax attribute in opposite direction of mouse
     * @param {MouseEvent} e - The mouse event
     */
    function handleParallaxMouseMove(e) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        if (parallaxElements.length === 0) return;

        // Calculate mouse position relative to center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate offset from center (-1 to 1 range)
        const offsetX = (centerX - e.clientX) / centerX;
        const offsetY = (centerY - e.clientY) / centerY;

        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 'medium';
            const multiplier = parallaxConfig[speed] || parallaxConfig.medium;

            // Calculate movement (clamped to max movement)
            const moveX = Math.max(-maxParallaxMovement, Math.min(maxParallaxMovement, offsetX * maxParallaxMovement * multiplier));
            const moveY = Math.max(-maxParallaxMovement, Math.min(maxParallaxMovement, offsetY * maxParallaxMovement * multiplier));

            // Apply transform - combines with existing animations
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }

    /**
     * Reset parallax elements to original position
     * Called when mouse leaves the viewport
     */
    function resetParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        parallaxElements.forEach(element => {
            element.style.transform = 'translate(0, 0)';
        });
    }

    /**
     * Initialize parallax effect
     * Adds data-parallax attributes to decorative elements
     */
    function initParallax() {
        // Add parallax to title decorations with varying speeds for depth effect
        const decoration1 = document.querySelector('.title-decoration-1');
        const decoration2 = document.querySelector('.title-decoration-2');
        const decoration3 = document.querySelector('.title-decoration-3');

        if (decoration1) decoration1.dataset.parallax = 'slow';
        if (decoration2) decoration2.dataset.parallax = 'medium';
        if (decoration3) decoration3.dataset.parallax = 'fast';

        // Add parallax to particles if they exist
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            // Alternate between slow and medium for subtle depth
            particle.dataset.parallax = index % 2 === 0 ? 'slow' : 'medium';
        });
    }

    // Initialize parallax on load
    initParallax();

    // Parallax mouse movement listener (using requestAnimationFrame for performance)
    let parallaxTicking = false;
    document.addEventListener('mousemove', (e) => {
        if (!parallaxTicking) {
            requestAnimationFrame(() => {
                handleParallaxMouseMove(e);
                parallaxTicking = false;
            });
            parallaxTicking = true;
        }
    });

    // Reset parallax when mouse leaves viewport
    document.addEventListener('mouseleave', resetParallax);

    // ============================================
    // Slide 10: Interaktiv Fordypning
    // ============================================

    /**
     * State for interactive slide 10
     */
    const interactiveState = {
        fysikk1: false,
        fysikk2: false,
        r1: false,
        r2: false
    };

    /**
     * Initialize interactive slide 10
     * Sets up click handlers for fag-cells
     */
    function initInteractiveSlide10() {
        const slide10 = document.querySelector('[data-slide="10"]');
        if (!slide10) return;

        const clickableCells = slide10.querySelectorAll('.fag-cell.clickable');

        clickableCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent slide navigation
                handleFagClick(cell);
            });
        });
    }

    /**
     * Handle click on a fag-cell
     * @param {HTMLElement} cell - The clicked cell element
     */
    function handleFagClick(cell) {
        const fagId = cell.dataset.fag;
        const fordypning = cell.dataset.fordypning;
        const requires = cell.dataset.requires;

        // Check if this fag requires another fag to be selected first
        if (requires && !interactiveState[requires]) {
            // Shake animation to indicate requirement
            cell.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                cell.style.animation = '';
            }, 500);
            return;
        }

        // Toggle selection
        if (interactiveState[fagId]) {
            // Deselect this fag
            interactiveState[fagId] = false;
            cell.classList.remove('selected', 'just-selected');

            // Also deselect any fag that requires this one
            Object.keys(interactiveState).forEach(key => {
                const otherCell = document.querySelector(`[data-fag="${key}"]`);
                if (otherCell && otherCell.dataset.requires === fagId) {
                    interactiveState[key] = false;
                    otherCell.classList.remove('selected', 'just-selected');
                }
            });
        } else {
            // Select this fag
            interactiveState[fagId] = true;
            cell.classList.add('selected', 'just-selected');

            // Remove just-selected class after animation
            setTimeout(() => {
                cell.classList.remove('just-selected');
            }, 600);
        }

        // Update arrows and results
        updateFordypningVisuals();
    }

    /**
     * Update arrows and result boxes based on current state
     */
    function updateFordypningVisuals() {
        const slide10 = document.querySelector('[data-slide="10"]');
        if (!slide10) return;

        // Update Fysikk arrow and result
        const fysikkArrow = slide10.querySelector('.fysikk-arrow');
        const fysikkResult = slide10.querySelector('.fysikk-result');

        if (interactiveState.fysikk1 && interactiveState.fysikk2) {
            // Only update arrow position if not already visible (prevents position drift)
            if (!fysikkArrow.classList.contains('visible')) {
                updateArrowPosition('fysikk');
                fysikkArrow.classList.add('visible');
            }
            // Show result
            fysikkResult.classList.add('visible');
        } else {
            fysikkArrow.classList.remove('visible');
            fysikkResult.classList.remove('visible');
        }

        // Update Matte arrow and result
        const matteArrow = slide10.querySelector('.matte-arrow');
        const matteResult = slide10.querySelector('.matte-result');

        if (interactiveState.r1 && interactiveState.r2) {
            // Only update arrow position if not already visible (prevents position drift)
            if (!matteArrow.classList.contains('visible')) {
                updateArrowPosition('matte');
                matteArrow.classList.add('visible');
            }
            // Show result
            matteResult.classList.add('visible');
        } else {
            matteArrow.classList.remove('visible');
            matteResult.classList.remove('visible');
        }
    }

    /**
     * Update arrow position based on cell positions
     * @param {string} type - 'fysikk' or 'matte'
     */
    function updateArrowPosition(type) {
        const slide10 = document.querySelector('[data-slide="10"]');
        if (!slide10) return;

        const container = slide10.querySelector('.fagvalg-interactive');
        const svg = slide10.querySelector('.fordypning-arrows');
        const arrow = slide10.querySelector(`.${type}-arrow`);

        let cell1, cell2;
        if (type === 'fysikk') {
            cell1 = slide10.querySelector('[data-fag="fysikk1"]');
            cell2 = slide10.querySelector('[data-fag="fysikk2"]');
        } else {
            cell1 = slide10.querySelector('[data-fag="r1"]');
            cell2 = slide10.querySelector('[data-fag="r2"]');
        }

        if (!cell1 || !cell2 || !container || !svg || !arrow) return;

        const containerRect = container.getBoundingClientRect();
        const cell1Rect = cell1.getBoundingClientRect();
        const cell2Rect = cell2.getBoundingClientRect();

        // Calculate positions relative to container
        // Use center X of cell1 for vertical arrow (x1 = x2)
        const centerX = cell1Rect.left + cell1Rect.width / 2 - containerRect.left;
        const y1 = cell1Rect.bottom - containerRect.top + 5;
        const y2 = cell2Rect.top - containerRect.top - 5;

        arrow.setAttribute('x1', centerX);
        arrow.setAttribute('y1', y1);
        arrow.setAttribute('x2', centerX);
        arrow.setAttribute('y2', y2);
    }

    /**
     * Reset interactive slide 10 state
     * Called when leaving the slide
     */
    function resetInteractiveSlide10() {
        interactiveState.fysikk1 = false;
        interactiveState.fysikk2 = false;
        interactiveState.r1 = false;
        interactiveState.r2 = false;

        const slide10 = document.querySelector('[data-slide="10"]');
        if (!slide10) return;

        // Remove all selected states
        slide10.querySelectorAll('.fag-cell.clickable').forEach(cell => {
            cell.classList.remove('selected', 'just-selected');
        });

        // Hide arrows and results
        slide10.querySelectorAll('.arrow-line').forEach(arrow => {
            arrow.classList.remove('visible');
        });

        slide10.querySelectorAll('.fordypning-result').forEach(result => {
            result.classList.remove('visible');
        });
    }

    // Add shake animation CSS dynamically
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // Initialize interactive slides
    initInteractiveSlide10();
    initInteractiveSlide11();

    // Reset interactive slides when leaving them and update slide menu
    const originalGoToSlide = goToSlide;
    goToSlide = function(slideNum) {
        // If leaving slide 10, reset its state
        if (currentSlide === 10 && slideNum !== 10) {
            resetInteractiveSlide10();
        }
        // If leaving slide 11, reset its state
        if (currentSlide === 11 && slideNum !== 11) {
            resetInteractiveSlide11();
        }
        originalGoToSlide(slideNum);
        // Update slide menu active state after navigation
        updateSlideMenuActive();
        // Update click-reveal indicator
        updateClickRevealIndicator();
    };

    // ============================================
    // Interactive Slide 11 (SSA)
    // ============================================

    // State for SSA slide
    const interactiveState11 = {
        okonomi1: false,
        okonomi2: false,
        samfunn1: false,
        samfunn2: false
    };

    /**
     * Initialize interactive slide 11
     */
    function initInteractiveSlide11() {
        const slide11 = document.querySelector('[data-slide="11"]');
        if (!slide11) return;

        const clickableCells = slide11.querySelectorAll('.fag-cell.clickable');

        clickableCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFagClickSlide11(cell);
            });
        });
    }

    /**
     * Handle click on a fag-cell in slide 11
     */
    function handleFagClickSlide11(cell) {
        const fagId = cell.dataset.fag;
        const fordypning = cell.dataset.fordypning;
        const requires = cell.dataset.requires;

        // Check if this fag requires another fag to be selected first
        if (requires && !interactiveState11[requires]) {
            cell.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                cell.style.animation = '';
            }, 500);
            return;
        }

        // Toggle selection
        if (interactiveState11[fagId]) {
            // Deselect this fag
            interactiveState11[fagId] = false;
            cell.classList.remove('selected', 'just-selected');

            // Also deselect any fag that requires this one
            Object.keys(interactiveState11).forEach(key => {
                const otherCell = document.querySelector(`[data-slide="11"] [data-fag="${key}"]`);
                if (otherCell && otherCell.dataset.requires === fagId) {
                    interactiveState11[key] = false;
                    otherCell.classList.remove('selected', 'just-selected');
                }
            });
        } else {
            // Select this fag
            interactiveState11[fagId] = true;
            cell.classList.add('selected', 'just-selected');

            setTimeout(() => {
                cell.classList.remove('just-selected');
            }, 600);
        }

        // Update arrows and results
        updateFordypningVisualsSlide11();
    }

    /**
     * Update arrows and result boxes for slide 11
     */
    function updateFordypningVisualsSlide11() {
        const slide11 = document.querySelector('[data-slide="11"]');
        if (!slide11) return;

        // Update Økonomi arrow and result
        const okonomiarrow = slide11.querySelector('.okonomi-arrow');
        const okonomiResult = slide11.querySelector('.okonomi-result');

        if (interactiveState11.okonomi1 && interactiveState11.okonomi2) {
            // Only update arrow position if not already visible (prevents position drift)
            if (!okonomiarrow.classList.contains('visible')) {
                updateArrowPositionSlide11('okonomi');
                okonomiarrow.classList.add('visible');
            }
            okonomiResult.classList.add('visible');
        } else {
            okonomiarrow.classList.remove('visible');
            okonomiResult.classList.remove('visible');
        }

        // Update Samfunn arrow and result
        const samfunnArrow = slide11.querySelector('.samfunn-arrow');
        const samfunnResult = slide11.querySelector('.samfunn-result');

        if (interactiveState11.samfunn1 && interactiveState11.samfunn2) {
            // Only update arrow position if not already visible (prevents position drift)
            if (!samfunnArrow.classList.contains('visible')) {
                updateArrowPositionSlide11('samfunn');
                samfunnArrow.classList.add('visible');
            }
            samfunnResult.classList.add('visible');
        } else {
            samfunnArrow.classList.remove('visible');
            samfunnResult.classList.remove('visible');
        }
    }

    /**
     * Update arrow position for slide 11
     */
    function updateArrowPositionSlide11(type) {
        const slide11 = document.querySelector('[data-slide="11"]');
        if (!slide11) return;

        const container = slide11.querySelector('.fagvalg-interactive');
        const svg = slide11.querySelector('.fordypning-arrows');
        const arrow = slide11.querySelector(`.${type}-arrow`);

        let cell1, cell2;
        if (type === 'okonomi') {
            cell1 = slide11.querySelector('[data-fag="okonomi1"]');
            cell2 = slide11.querySelector('[data-fag="okonomi2"]');
        } else {
            cell1 = slide11.querySelector('[data-fag="samfunn1"]');
            cell2 = slide11.querySelector('[data-fag="samfunn2"]');
        }

        if (!cell1 || !cell2 || !container || !svg || !arrow) return;

        const containerRect = container.getBoundingClientRect();
        const cell1Rect = cell1.getBoundingClientRect();
        const cell2Rect = cell2.getBoundingClientRect();

        // Vertical arrow - same X for both points
        const centerX = cell1Rect.left + cell1Rect.width / 2 - containerRect.left;
        const y1 = cell1Rect.bottom - containerRect.top + 5;
        const y2 = cell2Rect.top - containerRect.top - 5;

        arrow.setAttribute('x1', centerX);
        arrow.setAttribute('y1', y1);
        arrow.setAttribute('x2', centerX);
        arrow.setAttribute('y2', y2);
    }

    /**
     * Reset interactive slide 11 state
     */
    function resetInteractiveSlide11() {
        interactiveState11.okonomi1 = false;
        interactiveState11.okonomi2 = false;
        interactiveState11.samfunn1 = false;
        interactiveState11.samfunn2 = false;

        const slide11 = document.querySelector('[data-slide="11"]');
        if (!slide11) return;

        slide11.querySelectorAll('.fag-cell.clickable').forEach(cell => {
            cell.classList.remove('selected', 'just-selected');
        });

        slide11.querySelectorAll('.arrow-line').forEach(arrow => {
            arrow.classList.remove('visible');
        });

        slide11.querySelectorAll('.fordypning-result').forEach(result => {
            result.classList.remove('visible');
        });
    }

    // ============================================
    // Speech Bubble / Info Modal (Slide 11 - Spansk I+II)
    // ============================================

    /**
     * Initialize speech bubble functionality for info cells
     */
    function initSpeechBubbles() {
        const infoCells = document.querySelectorAll('.fag-cell.has-info');

        infoCells.forEach(cell => {
            const infoIcon = cell.querySelector('.info-icon');
            const speechBubble = cell.querySelector('.speech-bubble');
            const closeBtn = cell.querySelector('.speech-bubble-close');

            if (!infoIcon || !speechBubble) return;

            // Toggle bubble on info icon click
            infoIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSpeechBubble(speechBubble);
            });

            // Toggle bubble on cell click
            cell.addEventListener('click', (e) => {
                // Only toggle if clicking the cell itself, not other interactive elements
                if (e.target === cell || e.target.nodeType === 3) {
                    e.stopPropagation();
                    toggleSpeechBubble(speechBubble);
                }
            });

            // Close button
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeSpeechBubble(speechBubble);
                });
            }
        });

        // Close all speech bubbles when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fag-cell.has-info')) {
                closeAllSpeechBubbles();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllSpeechBubbles();
            }
        });
    }

    /**
     * Toggle a speech bubble's visibility
     * @param {HTMLElement} bubble - The speech bubble element
     */
    function toggleSpeechBubble(bubble) {
        if (bubble.classList.contains('visible')) {
            closeSpeechBubble(bubble);
        } else {
            // Close any other open bubbles first
            closeAllSpeechBubbles();
            bubble.classList.add('visible');
        }
    }

    /**
     * Close a specific speech bubble
     * @param {HTMLElement} bubble - The speech bubble element
     */
    function closeSpeechBubble(bubble) {
        bubble.classList.remove('visible');
    }

    /**
     * Close all open speech bubbles
     */
    function closeAllSpeechBubbles() {
        document.querySelectorAll('.speech-bubble.visible').forEach(bubble => {
            bubble.classList.remove('visible');
        });
    }

    // Initialize speech bubbles
    initSpeechBubbles();

    // ============================================
    // Optional Math Toggle (Slide 6)
    // ============================================

    /**
     * Initialize optional math boxes on slide 6
     * Allows toggling between colored and grayed-out state
     */
    function initOptionalMath() {
        const optionalMathBoxes = document.querySelectorAll('.math-box.optional-math');

        optionalMathBoxes.forEach(box => {
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                box.classList.toggle('grayed-out');
            });
        });
    }

    // Initialize optional math toggle
    initOptionalMath();

    // ============================================
    // Image Modal (Blokkskjema)
    // ============================================
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const imageModalClose = document.getElementById('imageModalClose');
    const modalImages = document.querySelectorAll('[data-modal-image]');

    /**
     * Open image modal with specified image
     * @param {string} src - Image source URL
     * @param {string} alt - Image alt text
     */
    function openImageModal(src, alt) {
        if (!imageModal || !modalImage) return;
        modalImage.src = src;
        modalImage.alt = alt;
        imageModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close image modal
     */
    function closeImageModal() {
        if (!imageModal) return;
        imageModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Click on any modal image to open modal
    modalImages.forEach(img => {
        img.addEventListener('click', () => {
            openImageModal(img.src, img.alt);
        });
    });

    // Close modal on X button click
    if (imageModalClose) {
        imageModalClose.addEventListener('click', closeImageModal);
    }

    // Close modal on backdrop click
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal && imageModal.classList.contains('visible')) {
            closeImageModal();
        }
    });

    // ============================================
    // QR Code Modal
    // ============================================
    const qrModal = document.getElementById('qrModal');
    const qrModalClose = document.getElementById('qrModalClose');
    const qrCodeTrigger = document.getElementById('qrCodeTrigger');
    const qrModalBackdrop = qrModal ? qrModal.querySelector('.qr-modal-backdrop') : null;

    /**
     * Open QR modal
     */
    function openQrModal() {
        if (!qrModal) return;
        qrModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close QR modal
     */
    function closeQrModal() {
        if (!qrModal) return;
        qrModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Click on QR code image to open modal
    if (qrCodeTrigger) {
        qrCodeTrigger.style.cursor = 'pointer';
        qrCodeTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openQrModal();
        });
    }

    // Close modal on X button click
    if (qrModalClose) {
        qrModalClose.addEventListener('click', closeQrModal);
    }

    // Close modal on backdrop click
    if (qrModalBackdrop) {
        qrModalBackdrop.addEventListener('click', closeQrModal);
    }

    // Close QR modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && qrModal && qrModal.classList.contains('visible')) {
            closeQrModal();
        }
    });

    // ============================================
    // Start Presentation
    // ============================================
    init();
    showKeyboardHint();
});
