class PawsPreferences {
    constructor() {
        this.cats = [];
        this.currentIndex = 0;
        this.likedCats = [];
        this.totalCats = 10;
        this.isLoading = false;

        this.cardContainer = document.getElementById('cardContainer');
        this.instructions = document.getElementById('instructions');
        this.notification = document.getElementById('notification');
        this.summaryScreen = document.getElementById('summaryScreen');
        this.loading = document.getElementById('loading');

        this.loadCats();
    }

    async loadCats() {
        this.isLoading = true;
        this.loading.style.display = 'flex';

        try {
            const catPromises = [];
            for (let i = 0; i < this.totalCats; i++) {
                catPromises.push(this.fetchCatImage());
            }

            this.cats = await Promise.all(catPromises);
            this.renderCards();
            this.loading.style.display = 'none';
            this.instructions.style.display = 'block';
        } catch (error) {
            console.error('Error loading cats:', error);
            this.loading.innerHTML = 'Oops! Cats are hiding. Please refresh! 🙈';
        }
    }

    async fetchCatImage() {
        const randomSeed = Math.random().toString(36).substring(7);
        const imageUrl = `https://cataas.com/cat?${randomSeed}`;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    url: imageUrl,
                    name: this.generateCatName(),
                    id: randomSeed
                });
            };
            img.onerror = () => {
                // Fallback if image fails to load
                resolve({
                    url: 'https://cataas.com/cat/cute',
                    name: this.generateCatName(),
                    id: randomSeed
                });
            };
            img.src = imageUrl;
        });
    }

    generateCatName() {
        const names = [
            'Whiskers', 'Mittens', 'Shadow', 'Luna', 'Simba',
            'Bella', 'Max', 'Chloe', 'Tiger', 'Smokey',
            'Princess', 'Buddy', 'Angel', 'Jack', 'Ginger',
            'Snowball', 'Oreo', 'Milo', 'Nala', 'Felix'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    renderCards() {
        this.cardContainer.innerHTML = '<div class="swipe-hint">👆 Swipe left to dislike, right to like</div>';

        for (let i = Math.min(this.currentIndex + 2, this.cats.length - 1); i >= this.currentIndex; i--) {
            if (i < this.cats.length) {
                const card = this.createCard(this.cats[i], i);
                this.cardContainer.appendChild(card);
            }
        }
    }

    createCard(cat, index) {
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.style.zIndex = this.cats.length - index;

        card.innerHTML = `
            <img src="${cat.url}" alt="${cat.name}" class="cat-image" />
            <div class="cat-info">
                <div class="cat-name">${cat.name}</div>
                <div class="cat-counter">${this.currentIndex + 1} of ${this.totalCats}</div>
            </div>
        `;

        // Add touch/mouse events for swiping
        this.addSwipeEvents(card);

        return card;
    }

    addSwipeEvents(card) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;

        const handleStart = (e) => {
            isDragging = true;
            const point = e.touches ? e.touches[0] : e;
            startX = point.clientX;
            startY = point.clientY;
            currentX = point.clientX;
            currentY = point.clientY;
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const point = e.touches ? e.touches[0] : e;
            currentX = point.clientX;
            currentY = point.clientY;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const rotation = deltaX * 0.1;

            card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
            card.style.opacity = Math.max(0.5, 1 - Math.abs(deltaX) / 200);
        };

        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            const deltaX = currentX - startX;
            const threshold = 100;

            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    this.likeCat();
                } else {
                    this.dislikeCat();
                }
            } else {
                // Snap back
                card.style.transform = 'translate(0, 0) rotate(0deg)';
                card.style.opacity = '1';
            }
        };

        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);

        card.addEventListener('touchstart', handleStart);
        card.addEventListener('touchmove', handleMove);
        card.addEventListener('touchend', handleEnd);
    }

    showNotification(type, message) {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 1500);
    }

    likeCat() {
        if (this.currentIndex < this.cats.length) {
            this.likedCats.push(this.cats[this.currentIndex]);
            this.showNotification('like', `😍 You loved ${this.cats[this.currentIndex].name}!`);
            this.animateCard('right');
            this.nextCat();
        }
    }

    dislikeCat() {
        if (this.currentIndex < this.cats.length) {
            this.showNotification('dislike', `😔 Not your type? That's okay!`);
            this.animateCard('left');
            this.nextCat();
        }
    }

    animateCard(direction) {
        const currentCard = document.querySelector('.cat-card');
        if (currentCard) {
            currentCard.classList.add(`swiped-${direction}`);
            setTimeout(() => {
                currentCard.remove();
            }, 300);
        }
    }

    nextCat() {
        this.currentIndex++;

        if (this.currentIndex >= this.cats.length) {
            this.showSummary();
        } else {
            setTimeout(() => {
                this.renderCards();
            }, 300);
        }
    }

    showSummary() {
        this.cardContainer.style.display = 'none';
        this.instructions.style.display = 'none';
        this.summaryScreen.style.display = 'block';

        document.getElementById('likedCount').textContent = this.likedCats.length;
        document.getElementById('totalCount').textContent = this.totalCats;

        const likedCatsContainer = document.getElementById('likedCats');
        likedCatsContainer.innerHTML = '';

        this.likedCats.forEach(cat => {
            const img = document.createElement('img');
            img.src = cat.url;
            img.alt = cat.name;
            img.className = 'liked-cat-img';
            img.title = cat.name;
            likedCatsContainer.appendChild(img);
        });
    }
}

function restartApp() {
    location.reload();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PawsPreferences();
});