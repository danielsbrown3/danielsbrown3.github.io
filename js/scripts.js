document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
});

 document.querySelector('.down-arrow').addEventListener('click', function() {
      document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
    });
