class ImageSlot extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready === 'true') return;
    this.dataset.ready = 'true';

    const src = this.getAttribute('src');
    const placeholder = this.getAttribute('placeholder') || '';
    const image = document.createElement('img');

    image.alt = this.getAttribute('alt') || placeholder.replace(/^Drop\s+/i, '');
    image.decoding = 'async';
    image.loading = this.id === 'hero-photo' ? 'eager' : 'lazy';
    image.style.display = 'block';
    image.style.height = '100%';
    image.style.objectFit = this.getAttribute('fit') || 'cover';
    image.style.width = '100%';

    if (src) {
      image.src = src;
      this.append(image);
    } else {
      const fallback = document.createElement('span');
      fallback.textContent = placeholder;
      fallback.style.display = 'grid';
      fallback.style.height = '100%';
      fallback.style.placeItems = 'center';
      fallback.style.width = '100%';
      this.append(fallback);
    }

    const credit = this.getAttribute('credit');
    const creditHref = this.getAttribute('credit-href');
    if (credit && creditHref) {
      const creditLink = document.createElement('a');
      creditLink.href = creditHref;
      creditLink.textContent = credit;
      creditLink.style.display = 'inline-block';
      creditLink.style.fontSize = '0.75rem';
      creditLink.style.marginTop = '0.25rem';
      this.append(creditLink);
    }
  }
}

customElements.define('image-slot', ImageSlot);
