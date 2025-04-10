document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tagFilters = document.querySelectorAll('.tag-filter');
    const postItems = document.querySelectorAll('.post-item');
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterPosts(searchTerm);
    });
    
    // Tag filter functionality
    tagFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Update active state
            tagFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            const selectedTag = filter.dataset.tag;
            filterPosts('', selectedTag);
        });
    });
    
    function filterPosts(searchTerm = '', selectedTag = 'all') {
        postItems.forEach(post => {
            const title = post.querySelector('h3').textContent.toLowerCase();
            const description = post.querySelector('.post-description').textContent.toLowerCase();
            const tags = post.dataset.tags.split(' ');
            
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
            const matchesTag = selectedTag === 'all' || tags.includes(selectedTag);
            
            if (matchesSearch && matchesTag) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        });
        
        // Hide empty year sections
        document.querySelectorAll('.posts-by-year').forEach(yearSection => {
            const visiblePosts = yearSection.querySelectorAll('.post-item[style="display: block"]');
            if (visiblePosts.length === 0) {
                yearSection.style.display = 'none';
            } else {
                yearSection.style.display = 'block';
            }
        });
    }
}); 