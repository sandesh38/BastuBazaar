/* ============================================
   BastuBazar — Authentication & Session Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    updateNavbarAuthState();

    // Firebase auth state listener
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                db.collection('users').doc(user.uid).get()
                    .then(doc => {
                        let role = 'buyer';

                        if (doc.exists) {
                            role = doc.data().role || 'buyer';
                        }

                        const userObj = {
                            id: user.uid,
                            email: user.email,
                            role: role
                        };

                        localStorage.setItem('bastubazar_user', JSON.stringify(userObj));
                        updateNavbarAuthState();
                    })
                    .catch(err => {
                        console.error(err);
                    });

            } else {
                localStorage.removeItem('bastubazar_user');
                updateNavbarAuthState();
            }
        });
    }
});


// =========================
// EMAIL LOGIN
// =========================
window.loginWithEmail = function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById("msg").style.color = "green";
            document.getElementById("msg").innerText = "Login Successful ✅";

            // window.location.href = "dashboard.html";
        })
        .catch((error) => {
            document.getElementById("msg").innerText = error.message;
        });
};


// =========================
// GOOGLE LOGIN
// =========================
window.loginWithGoogle = function () {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
        .then(() => {
            document.getElementById("msg").style.color = "green";
            document.getElementById("msg").innerText = "Google Login Success 🚀";

            // window.location.href = "dashboard.html";
        })
        .catch((error) => {
            document.getElementById("msg").innerText = error.message;
        });
};


// =========================
// LOGOUT
// =========================
window.logout = function () {
    firebase.auth().signOut()
        .then(() => {
            localStorage.removeItem('bastubazar_user');
            window.location.href = 'index.html';
        });
};


// =========================
// CURRENT USER
// =========================
function getCurrentUser() {
    const userStr = localStorage.getItem('bastubazar_user');
    return userStr ? JSON.parse(userStr) : null;
}


// =========================
// NAVBAR UPDATE
// =========================
function updateNavbarAuthState() {
    const user = getCurrentUser();

    const loginBtn = document.getElementById('btn-login');

    if (loginBtn && loginBtn.parentElement) {
        const container = loginBtn.parentElement;

        if (user) {
            let dashboard = 'index.html';

            if (user.role === 'buyer') dashboard = 'buyer.html';
            else if (user.role === 'seller') dashboard = 'seller.html';
            else if (user.role === 'admin') dashboard = 'admin.html';

            container.innerHTML = `
                <a href="${dashboard}" class="btn btn-primary btn-sm rounded-pill px-3">
                    Dashboard
                </a>
                <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="logout()">
                    Logout
                </button>
            `;
        } else {
            container.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary btn-sm rounded-pill px-3">
                    Login
                </a>
                <a href="login.html" class="btn btn-primary btn-sm rounded-pill px-3">
                    List Item
                </a>
            `;
        }
    }
}


// =========================
// PROTECT PAGES
// =========================
window.requireAuth = function (role = null) {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = 'login.html';
    } else if (role && user.role !== role) {
        window.location.href = 'index.html';
    }
};


// =========================
// DEMO LOGIN (HACKATHON)
// =========================
window.demoLogin = function (role) {
    let name = "Guest User";
    if (role === 'buyer') name = "Demo Buyer";
    else if (role === 'seller') name = "Demo Seller";
    else if (role === 'admin') name = "Platform Admin";

    const userObj = {
        id: 'demo-' + Date.now(),
        email: `demo_${role}@bastubazar.com`,
        name: name,
        role: role
    };

    localStorage.setItem('bastubazar_user', JSON.stringify(userObj));
    updateNavbarAuthState();

    if (role === 'buyer') window.location.href = 'buyer.html';
    else if (role === 'seller') window.location.href = 'seller.html';
    else if (role === 'admin') window.location.href = 'admin.html';
};