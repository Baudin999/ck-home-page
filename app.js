// Homepage Application with Alpine.js
document.addEventListener('alpine:init', () => {
    // Main Application
    Alpine.data('homepageApp', () => ({
        links: [],
        
        init() {
            this.loadLinks();
            this.$watch('links', () => {
                this.saveLinks();
            });
        },
        
        // Load links from localStorage
        loadLinks() {
            const storedLinks = localStorage.getItem('homepage-links');
            if (storedLinks) {
                try {
                    this.links = JSON.parse(storedLinks);
                } catch (e) {
                    console.error('Error parsing stored links:', e);
                    this.links = [];
                }
            }
        },
        
        // Save links to localStorage
        saveLinks() {
            localStorage.setItem('homepage-links', JSON.stringify(this.links));
        },
        
        // Generate a unique ID
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        },
        
        // Extract favicon from URL
        getFaviconUrl(url) {
            try {
                const urlObj = new URL(url);
                return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            } catch (e) {
                return 'https://via.placeholder.com/48';
            }
        },
        
        // Get hostname from URL
        getHostname(url) {
            try {
                return new URL(url).hostname;
            } catch (e) {
                return url;
            }
        },
        
        // Open link in new tab
        openLink(url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        },
        
        // Open add link modal
        openAddLinkModal() {
            Alpine.store('modal').open();
        },
        
        // Open edit link modal
        openEditLinkModal(id) {
            const link = this.links.find(l => l.id === id);
            if (link) {
                Alpine.store('modal').openEdit(link);
            }
        },
        
        // Delete a link
        deleteLink(id) {
            if (confirm('Are you sure you want to delete this link?')) {
                this.links = this.links.filter(l => l.id !== id);
            }
        },
        
        // Export links to JSON file
        exportLinks() {
            if (this.links.length === 0) {
                alert('No links to export');
                return;
            }
            
            const dataStr = JSON.stringify(this.links, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mars-homepage-links-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        },
        
        // Handle import file selection
        handleImport(e) {
            if (e.target.files.length > 0) {
                this.importLinks(e.target.files[0]);
                e.target.value = null; // Reset the input
            }
        },
        
        // Import links from JSON file
        importLinks(file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedLinks = JSON.parse(e.target.result);
                    
                    if (!Array.isArray(importedLinks)) {
                        throw new Error('Invalid format');
                    }
                    
                    // Validate each link
                    importedLinks.forEach(link => {
                        if (!link.title || !link.url || typeof link.title !== 'string' || typeof link.url !== 'string') {
                            throw new Error('Invalid link format');
                        }
                        
                        // Validate URL
                        new URL(link.url);
                    });
                    
                    if (confirm(`Import ${importedLinks.length} links? This will replace your current links.`)) {
                        this.links = importedLinks.map(link => ({
                            ...link,
                            id: link.id || this.generateId() // Ensure each link has an ID
                        }));
                    }
                } catch (error) {
                    alert('Error importing links: Invalid file format');
                    console.error('Import error:', error);
                }
            };
            
            reader.readAsText(file);
        }
    }));
    
    // Modal Application
    Alpine.data('modalApp', () => ({
        isOpen: false,
        currentLinkId: null,
        linkTitle: '',
        linkUrl: '',
        
        init() {
            // Initialize modal state
            Alpine.store('modal', {
                open: () => {
                    this.isOpen = true;
                    this.currentLinkId = null;
                    this.linkTitle = '';
                    this.linkUrl = '';
                    setTimeout(() => document.getElementById('link-title').focus(), 100);
                },
                
                openEdit: (link) => {
                    this.isOpen = true;
                    this.currentLinkId = link.id;
                    this.linkTitle = link.title;
                    this.linkUrl = link.url;
                    setTimeout(() => document.getElementById('link-title').focus(), 100);
                },
                
                close: () => {
                    this.isOpen = false;
                }
            });
            
            // Handle escape key to close modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeModal();
                }
            });
        },
        
        closeModal() {
            this.isOpen = false;
        },
        
        saveLink() {
    // Get the values and trim whitespace
    let url = this.linkUrl.trim();
    let title = this.linkTitle.trim();
    
    // Ensure URL has protocol if missing
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    
    try {
        // Try to create a URL object to validate
        const urlObj = new URL(url);
        
        // Find the homepage element in the DOM and get its Alpine instance
        const homepageEl = document.querySelector('[x-data="homepageApp"]');
        if (!homepageEl) {
            throw new Error("Could not find homepageApp element");
        }
        
        // Access the Alpine component instance directly from the DOM element
        const homeApp = Alpine.$data(homepageEl);
        
        if (this.currentLinkId) {
            // Update existing link
            const linkIndex = homeApp.links.findIndex(l => l.id === this.currentLinkId);
            if (linkIndex !== -1) {
                homeApp.links[linkIndex] = {
                    ...homeApp.links[linkIndex],
                    title: title,
                    url: urlObj.href,
                    dateUpdated: new Date().toISOString()
                };
                
                // Update the links array to trigger reactivity
                homeApp.links = [...homeApp.links];
            }
        } else {
            // Add new link
            const newLink = {
                id: homeApp.generateId(),
                title: title,
                url: urlObj.href,
                dateAdded: new Date().toISOString()
            };
            
            homeApp.links = [...homeApp.links, newLink];
        }
        
        this.closeModal();
    } catch (e) {
        console.error(e);
        alert('Please enter a valid URL');
    }
}    }));
});
