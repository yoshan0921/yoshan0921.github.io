import {
    auth
} from "./firebase/firebase.js";

let localStorageItems = [
    "currentUserID",
    "currentUserRole",
    "errors",
    "errors123"
]
/**
 * Redirects to the page specified on the path
 * @param {String} path - path to the requested page
 */
function redirect(path){
    window.location.pathname = path;
}
/**
 * Self-explanatory
 */
function signOut(){
    auth.signOut().then(() => {
        // Sign-out successful.
        resetLocalStorage();
        redirect("/index.html");
      }).catch((error) => {
        // An error happened.
        console.log("Error while trying to logout")
      });
}
/**
 * Function that will display an error message for the user.
 * Every page that might throw an error should call this function
 * 
 * Obs.: In the future it should be rewritten to trigger a
 * visual response (i.e a modal or redirect to an error page)
 * 
 * @param {Error} error object
 */
function handleError(error){
    console.log(error);
}
/**
 * 
 */
function resetLocalStorage(){
    console.log("here");
    for(let item of localStorageItems){
        window.localStorage.removeItem(item);
    }
}
/**
 * 
 */
function enableBackButton(){
    const backBtn = document.getElementsByClassName("back-btn-wrapper")[0];
    if(backBtn) {
        backBtn.style.display = "flex";
        backBtn.addEventListener("click", (e) => {
            window.history.back();
        });
    }

}
function installServiceWorkers(){
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("../sw.js")
          .then(serviceWorker => {
            console.log("Service Worker registered: ", serviceWorker);
          })
          .catch(error => {
            console.error("Error registering the Service Worker: ", error);
          });
      }
}
function enableConfirmRedirectDialog(){
    window.addEventListener("beforeunload", enableDialog);
}
function enableDialog(e){
    e.preventDefault();
    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true;
}
function disableConfirmRedirectDialog(){
    window.removeEventListener("beforeunload", enableDialog);
}
export {
    signOut,
    redirect,
    handleError,
    resetLocalStorage,
    enableBackButton,
    installServiceWorkers,
    enableConfirmRedirectDialog,
    disableConfirmRedirectDialog
}