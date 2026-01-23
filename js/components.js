// Component Loader for ArbanTV
class ComponentLoader {
  constructor() {
    this.components = new Map();
    this.loadedComponents = new Set();
  }

  // Register component paths
  registerComponents() {
    this.components.set("header", "./components/header.html");
    this.components.set("hero", "./components/hero.html");
    this.components.set("trending", "./components/trending.html");
    this.components.set("storytellers", "./components/storytellers.html");
    this.components.set("memes", "./components/memes.html");
    this.components.set("cinematic", "./components/cinematic.html");
    this.components.set("influencers", "./components/influencers.html");
    this.components.set("memeyai", "./components/memeyai.html");
    this.components.set("footer", "./components/footer.html");
  }

  // Load a single component
  async loadComponent(componentName, targetSelector) {
    try {
      const componentPath = this.components.get(componentName);
      if (!componentPath) {
        throw new Error(`Component '${componentName}' not found`);
      }

      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${response.status}`);
      }

      const html = await response.text();
      const targetElement = document.querySelector(targetSelector);

      if (targetElement) {
        targetElement.innerHTML = html;
        this.loadedComponents.add(componentName);
        console.log(`✓ Component '${componentName}' loaded successfully`);
      } else {
        throw new Error(`Target selector '${targetSelector}' not found`);
      }
    } catch (error) {
      console.error(`Error loading component '${componentName}':`, error);
    }
  }

  // Load all components
  async loadAllComponents() {
    const componentMappings = [
      { name: "header", selector: ".header-placeholder" },
      { name: "hero", selector: ".hero-placeholder" },
      { name: "trending", selector: ".trending-placeholder" },
      { name: "storytellers", selector: ".storytellers-placeholder" },
      { name: "memes", selector: ".memes-placeholder" },
      { name: "cinematic", selector: ".cinematic-placeholder" },
      { name: "influencers", selector: ".influencers-placeholder" },
      { name: "memeyai", selector: ".memeyai-placeholder" },
      { name: "footer", selector: ".footer-placeholder" },
    ];

    const loadPromises = componentMappings.map(({ name, selector }) =>
      this.loadComponent(name, selector),
    );

    await Promise.all(loadPromises);
    console.log("🎉 All components loaded successfully!");

    // Initialize navigation after components are loaded
    this.initializeNavigation();
  }

  // Initialize navigation functionality
  initializeNavigation() {
    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("nav-open");
        menuToggle.classList.toggle("menu-open");
      });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          // Update active nav link
          navLinks.forEach((nl) => nl.classList.remove("active"));
          link.classList.add("active");
        }
      });
    });

    // Hero buttons functionality
    const heroButtons = document.querySelectorAll(".hero-btn");
    heroButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.textContent.includes("Explore")) {
          document.querySelector("#trending").scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else if (btn.textContent.includes("Join")) {
          // Add join community functionality here
          console.log("Join Community clicked");
        }
      });
    });
  }

  // Get loading status
  getLoadStatus() {
    return {
      total: this.components.size,
      loaded: this.loadedComponents.size,
      remaining: this.components.size - this.loadedComponents.size,
      components: Array.from(this.loadedComponents),
    };
  }
}

// Initialize component loader when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 ArbanTV Component Loader initializing...");

  const loader = new ComponentLoader();
  loader.registerComponents();

  // Show loading overlay
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }

  try {
    await loader.loadAllComponents();
    console.log("📊 Load Status:", loader.getLoadStatus());
  } finally {
    // Hide loading overlay after components are loaded (with delay for smooth transition)
    setTimeout(() => {
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
        setTimeout(() => {
          loadingOverlay.style.display = "none";
        }, 500); // Match CSS transition duration
      }
    }, 1000); // Show loading for at least 1 second for better UX
  }
});

// Export for potential external use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ComponentLoader;
}
