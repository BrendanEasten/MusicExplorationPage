let currentIndex = 0;
let images = document.querySelectorAll('.album-cover');

// Function to update images (in case new ones are added)
function updateImages() {
  images = document.querySelectorAll('.album-cover');
}

// Function to handle the image transition
function changeImage() {
  // Remove the active class from the current image
  images[currentIndex].classList.remove('active');
  
  // Increment the index to point to the next image
  currentIndex = (currentIndex + 1) % images.length;

  // Add the active class to the next image
  images[currentIndex].classList.add('active');
}

// Start by showing the first image
images[currentIndex].classList.add('active');

// Change the image every 3 seconds (adjust as needed)
setInterval(() => {
  updateImages(); // Update the images list if new images are added
  changeImage(); // Change the image to the next one
}, 3000)

// Get all nav links
document.addEventListener('DOMContentLoaded', () => {
  // Get the current page URL
  const currentPage = window.location.pathname.split("/").pop();

  // Get all the nav links
  const navLinks = document.querySelectorAll('.nav-link');

  // Loop through all the nav links and check if the href exactly matches the current page
  navLinks.forEach(link => {
    // Extract the page name from the link href (use split to get the filename)
    const linkPage = link.getAttribute('href').split("/").pop();

    // If the link href exactly matches the current page, add the active class
    if (currentPage === linkPage) {
      link.classList.add('active');
    }
  });
});

const clientId = '5f8c85d5efee4c1cb9d33b705c430006'; // Your Spotify Client ID
    const redirectUri = 'http://localhost:3000/callback'; // This must match the redirect URI in Spotify Developer Dashboard
    const scopes = 'user-top-read playlist-modify-private'; // The scopes your app needs

    // Event listener for the "Login with Spotify" button
    document.getElementById('loginButton').addEventListener('click', () => {
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
      window.location.href = authUrl; // Redirect user to login with Spotify
    });

    // Function to handle the callback and get the access token
    window.onload = function () {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code'); // Get the authorization code from URL

      if (code) {
        fetchAccessToken(code); // Fetch the access token using the code
      }
    };

    // Fetch the access token using the authorization code
    async function fetchAccessToken(code) {
      const response = await fetch(`http://localhost:3000/callback?code=${code}`, {
        method: 'GET'
      });
      
      const tokenData = await response.json();
      if (tokenData.access_token) {
        fetchRecommendations(tokenData.access_token); // Fetch recommendations once the token is available
      }
    }

    // Function to fetch recommendations using the access token
async function fetchRecommendations(accessToken) {
  const response = await fetch(`http://localhost:3000/recommendations?access_token=${accessToken}`);
  const recommendations = await response.json();

  const container = document.getElementById('recommendationCards');
  container.innerHTML = ''; // Clear any previous recommendations

  recommendations.forEach(track => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${track.imageUrl}" alt="${track.name}">
      <h3>${track.name}</h3>
      <p>${track.artists}</p>
    `;

    container.appendChild(card);
  });
}

// Function to handle the callback and get the access token
window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code'); // Get the authorization code from URL

  if (code) {
    fetchAccessToken(code); // Fetch the access token using the code
  }
};

// Fetch the access token using the authorization code
async function fetchAccessToken(code) {
  const response = await fetch(`http://localhost:3000/callback?code=${code}`, {
    method: 'GET'
  });
  
  const tokenData = await response.json();
  if (tokenData.access_token) {
    fetchRecommendations(tokenData.access_token); // Fetch recommendations once the token is available
  }
}

// Function to fetch recommendations using the access token
async function fetchRecommendations(accessToken) {
  const response = await fetch(`http://localhost:3000/recommendations?access_token=${accessToken}`);
  const recommendations = await response.json();

  const container = document.getElementById('recommendationCards');
  container.innerHTML = ''; // Clear any previous recommendations

  // Check if recommendations are returned
  if (recommendations.length > 0) {
    recommendations.forEach(track => {
      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = `
        <img src="${track.imageUrl}" alt="${track.name}">
        <h3>${track.name}</h3>
        <p>${track.artists}</p>
      `;

      container.appendChild(card);
    });
  } else {
    const noResultsMessage = document.createElement('p');
    noResultsMessage.textContent = 'No recommendations found';
    container.appendChild(noResultsMessage);
  }
}

// Callback route to exchange the code for access token
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No code received');
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = 'http://localhost:3000/callback';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }), {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = response.data;
    const recommendations = await fetchRecommendationsFromSpotify(access_token);
    
    // Send the recommendations to the frontend
    res.redirect(`/recommendationsPage.html?access_token=${access_token}`); // Redirect to another HTML page that shows recommendations
  } catch (error) {
    console.error('Failed to authenticate with Spotify', error);
    res.status(500).send('Failed to authenticate with Spotify');
  }
});