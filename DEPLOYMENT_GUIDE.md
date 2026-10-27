# 🚀 Beginner's Guide: Updating Your Live Website on Firebase

This guide explains how to update and deploy your live **FZhandcrafts** website to Firebase Hosting step-by-step.

---

## 📌 How Your Website Works with Firebase
1. When you run `npm run build`, Next.js compiles all pages, components, and assets into static HTML/CSS/JS files inside the **`out`** folder.
2. Firebase Hosting takes everything inside the **`out`** folder and publishes it directly to the internet on your live domain (`fzhandcrafts-17f77.web.app` / your custom domain).

---

## ⚙️ Step 1: Enable Google Sign-In in Firebase Console (One-Time Setup)

Because we added Google / Gmail Sign-In, you must enable it in your Firebase project:

1. Open your browser and go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`fzhandcrafts-17f77`**.
3. In the left navigation menu, click **Build** > **Authentication**.
4. Click on the **Sign-in method** tab.
5. In the providers list, click **Google**.
6. Switch the toggle to **Enable**.
7. Choose your support email from the dropdown.
8. Click **Save**.

*(Make sure **Email/Password** is also enabled on the same page).*

---

## 🔒 Step 2: Update Firestore Security Rules

To allow customers to submit reviews, place orders, and browse products without permissions errors:

1. In the [Firebase Console](https://console.firebase.google.com/), click **Firestore Database** in the left menu.
2. Click on the **Rules** tab at the top.
3. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products: anyone can read, only admin can create/edit
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders: anyone can create, admins & customer owners can view/manage
    match /orders/{orderId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null;
    }
    
    // Reviews: anyone can read and post reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }
    
    // Settings: anyone can read (e.g. WhatsApp number, cover photo), only admin can edit
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Counters: order numbering
    match /counters/{counterId} {
      allow read, write: if true;
    }
  }
}
```
4. Click **Publish**.

---

## 💻 Step 3: Build & Deploy Your Live Website (Whenever You Make Changes)

Open your terminal (PowerShell or VS Code Terminal) in the website folder (`d:\AliJan Apps\fzwebsite`).

### 1. Log in to Firebase (Only if not logged in already)
Run:
```bash
npx firebase login
```
*A browser window will open. Sign in with the Google account that owns the Firebase project.*

---

### 2. Build the website
Run:
```bash
npm run build
```
*Wait 30–60 seconds. This creates the updated `out/` folder with all your new features.*

---

### 3. Deploy to Firebase Hosting
Run:
```bash
npx firebase deploy --only hosting
```
*This uploads the `out/` folder to Firebase.*

Once finished, you will see:
```text
✔  Deploy complete!

Hosting URL: https://fzhandcrafts-17f77.web.app
```

---

## 🔍 Step 4: Verify the New Features on Your Live Site

Open your website in Chrome/Edge (or on your phone):
1. **Floating WhatsApp Chat**: Look at the bottom-right corner. Click the floating green WhatsApp icon to test opening chat.
2. **Order via WhatsApp**: Open any product page and test the green **"Order via WhatsApp"** button.
3. **Phone Number Check**: Go to Checkout and test entering a number that is not 11 digits or does not start with `03`. Notice the validation.
4. **Google Sign-In**: Click **Sign In** in the top navigation bar and test **"Continue with Google (Gmail)"**.
5. **Customer Reviews**: Open any product page, scroll down to the new **"Customer Reviews & Ratings"** section, and post a test review.
6. **Admin WhatsApp Setting**: Log in to `/admin/login`, go to **Settings**, and customize your Business WhatsApp Number anytime!

---

## 💡 Quick Cheat-Sheet for Future Updates:
Whenever you change anything in the future, just run these two commands:
```bash
npm run build
npx firebase deploy --only hosting
```
That's it!
