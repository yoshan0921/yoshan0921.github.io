import { getDocument, updateProperty, getFile } from "../firebase/firestore.js";
import { openModal, closeModal, lazyLoadImages } from "../common.js";
import { enableBackButton, finishLoading, redirect } from "../utils.js";
import { sendNotification } from "../notification.js";
import { getCurrentUserID } from "../firebase/authentication.js";

// TODO: Need to define placeholder image properly
const placeholderImage = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";

let taskID;
let taskData;

/**
 * This adds an event listener to the page that triggers once everything is done downloading.
 * This is to prevent the code from trying to access an element from the page before it was
 * rendered there
 *
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runFunction);
} else {
  runFunction();
}

function runFunction() {
  // Get task ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  taskID = urlParams.get("taskid");
  //console.log(taskID);

  // Get the task data from the Firestore
  getDocument("tasks", taskID)
    .then((task) => {
      console.log(task);
      // Save the task data to a global variable
      taskData = task;
    })
    .catch((error) => {
      console.log(error);
    });
}

// Display summary
displayTaskSummary(taskID).then(() => {
  const main = document.getElementsByTagName("main")[0];
  main.classList.add("loaded");
  // Note:
  // The back button did not work correctly.
  // Because enableBackButton function was also called another place,
  // and addEventListener was added twice to the back button.
  // So, I commented out the code below. (Yosuke)
  // enableBackButton();
});

async function displayTaskSummary(taskID) {
  try {
    // Fetch task details from Firestore
    const task = await getDocument("tasks", taskID);

    // Select elements to display task details
    const favorTypeH2Data = document.getElementById("favorTypeH2");
    const taskStatusData = document.getElementById("taskStatus");
    // const favorTypeData = document.getElementById("favorType");
    const dateData = document.getElementById("date");
    const timeData = document.getElementById("time");
    const dateLabel = document.getElementById("dateLabel");
    const timeLabel = document.getElementById("timeLabel");
    const hideCancelFavor = document.getElementById("cancelFavor");
    const approveFavor = document.getElementById("approveFavor");
    const createAgain = document.getElementById("createAgain");
    const contactBtn = document.getElementById("contactBtn");
    const displayStatus = document.getElementById("displayStatus");
    const cancelReason = document.getElementById("cancelReason")
    let parentLi = cancelReason.parentElement;

    // const favorLengthData = document.getElementById("favorLength");
    const startAddressData = document.getElementById("startAddress");
    const endAddressData = document.getElementById("endAddress");
    // const taskIdData = document.getElementById("taskID");
    const notesData = document.getElementById("notes");

    // Change color of statusColor depending on status
    const statusColor = document.querySelector(".statusColor");
    if (task.status == "Waiting to be accepted") {
      statusColor.style.backgroundColor = "red";
    }

    switch (task.status) {
      case "Waiting to be accepted":
        statusColor.style.backgroundColor = "#ffcd29";
        break;
      case "On going":
        statusColor.style.backgroundColor = "#156A85";
        break;
      case "Pending approval":
        statusColor.style.backgroundColor = "#F24822";
        break;
      case "Completed":
        statusColor.style.backgroundColor = "#44c451";
        break;
      case "Cancelled":
        statusColor.style.backgroundColor = "#f24822";
        break;
      default:
        statusColor.style.backgroundColor = "white";
    }

    console.log(task.status);

    // Display task details in the respective HTML elements
    favorTypeH2Data.innerHTML = `${task.name} Favor`;
    taskStatusData.innerHTML = task.status;
    // favorTypeData.innerHTML = task.name;

    // Update Date and Time if it is cancelled
    if (task.status == "Cancelled" && task.details.cancelledDate) {
      dateData.innerHTML = task.details.cancelledDate;
      timeData.innerHTML = task.details.cancelledTime;
      // Display cancel reason
      cancelReason.innerHTML = task.details.cancelReason || "No reason given";
      // Change the Date and Time labels
      dateLabel.innerHTML = `<span class="date-icon"></span>Cancelled Date:`;
      timeLabel.innerHTML = `<span class="time-icon"></span>Cancelled Time:`;
      // Hide cancelFavor button if a favor is cancelled
      hideCancelFavor.classList.add("hidden");
      // Hide approve button
      approveFavor.classList.add("hidden");
      // Hide contactBtn
      contactBtn.classList.add("hidden");
      // Hide status
      displayStatus.classList.add("hidden");

      // Update Date and Time if it is completed
    } else if (task.status == "Completed" && task.details.completedDate) {
      dateData.innerHTML = task.details.completedDate;
      timeData.innerHTML = task.details.completedTime;
      // Change the Date and Time labels
      dateLabel.innerHTML = `<span class="date-icon"></span>Completed Date:`;
      timeLabel.innerHTML = `<span class="time-icon"></span>Completed Time:`;
      // Hide cancel reason
      parentLi.classList.add("hidden");
      // Hide cancelFavor button if a favor is completed
      hideCancelFavor.classList.add("hidden");
      // Hide approve button
      approveFavor.classList.add("hidden");
      // Hide contactBtn
      contactBtn.classList.add("hidden");
      // Hide status
      displayStatus.classList.add("hidden");

      // Display these details when it is on going
    } else if (task.status == "On going" && task.details.date) {
      dateData.innerHTML = task.details.date;
      timeData.innerHTML = task.details.time;
      // Hide cancel reason
      parentLi.classList.add("hidden");
      // Hide cancelFavor button if a favor is pending approval
      approveFavor.classList.add("hidden");
      createAgain.classList.add("hidden");

      // Display these details when it is waiting to be accepted
    } else if (task.status == "Waiting to be accepted" && task.details.date) {
      dateData.innerHTML = task.details.date;
      timeData.innerHTML = task.details.time;
      // Hide cancel reason
      parentLi.classList.add("hidden");
      // Hide cancelFavor button if a favor is pending approval
      approveFavor.classList.add("hidden");
      createAgain.classList.add("hidden");
      // Hide contactBtn
      contactBtn.classList.add("hidden");

      // Display these details when it is pending approval
    } else if (task.status == "Pending approval" && task.details.date) {
      dateData.innerHTML = task.details.date;
      timeData.innerHTML = task.details.time;
      // Hide cancel reason
      parentLi.classList.add("hidden");
      // Hide cancelFavor button if a favor is pending approval
      hideCancelFavor.classList.add("hidden");
      createAgain.classList.add("hidden");

      // Default
    } else {
      dateData.innerHTML = task.details.date;
      timeData.innerHTML = task.details.time;
    }

    // favorLengthData.innerHTML = task.details.favorLength;
    startAddressData.innerHTML = task.details.startAddress;
    endAddressData.innerHTML = task.details.endAddress;
    // taskIdData.innerHTML = taskID;
    notesData.innerHTML = task.notes;

    // Fetch volunteer information
    const volunteer = await getDocument("users", task.volunteerID);
    if (volunteer) {
      const volunteerInfo = document.getElementById("volunteerInfo");
      volunteerInfo.innerHTML = `
        <div class="requester">
        <img class="photo" src="${placeholderImage}" data-storage-path="profile/${volunteer.profilePictureURL}">
        <div class="profile">
          <p class="name">${volunteer.firstName} ${volunteer.lastName}</p>
          <p class="address">${volunteer.institution}</p>
        </div>
      `;
    }

    // Set the volunteer profile link
    const volunteerProfileLink = document.getElementById("profileLink");
    volunteerProfileLink.setAttribute("href", `/profile.html?userid=${task.volunteerID}`);

    // Apply lazy loading to images
    lazyLoadImages();
    finishLoading();
  } catch (error) {
    console.log("Error fetching task:", error);
  }
}

// Event listener for cancelFavor button
const cancelFavorBtn = document.getElementById("cancelFavor");
cancelFavorBtn.addEventListener("click", () => {
  const modal = document.getElementById("confirmModal");
  openModal(modal); // Call openModal with modal element
  const modalFavor = document.getElementById("modalFavor");
  const modalFavorSpan = modalFavor.querySelector("span");
  modalFavorSpan.innerText = taskData.name;
});

// Event listener for modal back button
const modalBackBtn = document.getElementById("modalBackBtn");
modalBackBtn.addEventListener("click", () => {
  const modal = document.getElementById("confirmModal");
  closeModal(modal);
});

// Event listener to go back to home
const backToHome = document.getElementById("backToHome");
backToHome.addEventListener("click", () => {
  redirect("../dashboard.html");
});

// Event listener to go back to home from approving favor modal
const backToHomeApproved = document.getElementById("backToHomeApproved");
backToHomeApproved.addEventListener("click", () => {
  redirect("../dashboard.html");
});

// Event listener to go back to home from approving favor modal
const createAgain = document.getElementById("createAgain");
createAgain.addEventListener("click", () => {
  redirect("../tasks/create.html");
});

// Event listener to go to get support
const getSupport = document.getElementById("getSupport");
getSupport.addEventListener("click", () => {
  redirect("../support.html");
});

// Update task status to cancelled
const modalCancelFavorBtn = document.getElementById("modalCancelFavor");
modalCancelFavorBtn.addEventListener("click", async () => {
  try {
    // Get the current date and time, formatted with international format
    const now = new Date();
    const cancelledDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(now);
    const cancelledTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Get the selected cancel reason
    let cancelReason;
    let selectedReason = document.querySelector('input[name="cancelReason"]:checked');
    if (selectedReason) {
      cancelReason = selectedReason.value;
      console.log(cancelReason)
    } else {
      cancelReason = "No reason given";
      console.log(cancelReason)
    }

    // Update task status to "Cancelled" in Firestore
    await updateProperty("tasks", taskID, {
      status: "Cancelled",
      "details.cancelledDate": cancelledDate,
      "details.cancelledTime": cancelledTime,
      // Add the cancel reason
      "details.cancelReason": cancelReason,
    });
    // Display the success modal
    // const successModal = document.getElementById("successModal");
    // openModal(successModal);

    // Close the modal after updating task status
    // const modal = document.getElementById("confirmModal");
    // closeModal(modal);

    // Create a URLSearchParams object from the current URL
    var urlParams = new URLSearchParams(window.location.search);

    // Get the value of the 'taskid' parameter
    var taskid = urlParams.get("taskid");

    // Construct the URL for the new page with taskid parameter
    var newURL = "../tasks/cancel.html?taskid=" + taskid;
    const task = await getDocument("tasks", taskID);
    const currentUser = await getDocument("users", getCurrentUserID());
    let url = "#";
    if (currentUser.profilePictureURL) {
      url = await getFile(`profile/${currentUser.profilePictureURL}`);
    }
    sendNotification(
      {
        title: "Task Cancelled",
        message: `<span>${currentUser.firstName}</span> has cancelled their <span>${task.name}</span> favour`,
        updateType: "warning",
        icon: url,
        link: `../tasks/volunteer-favor.html?taskid=${taskID}`,
        senderID: currentUser.id
      }
      ,task.volunteerID);

    // Display complete favor page
    window.location.href = newURL;
  } catch (error) {
    console.error("Error updating task status:", error);
  }
});

// Update task status to Completed (from Pending Approval)
const approveFavorBtn = document.getElementById("approveFavor");
approveFavorBtn.addEventListener("click", async () => {
  try {
    // Get the current date and time, formatted with international format
    const now = new Date();
    const completedDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(now);
    const completedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Update task status to "Cancelled" in Firestore
    await updateProperty("tasks", taskID, {
      status: "Completed",
      "details.completedDate": completedDate,
      "details.completedTime": completedTime,
    });
    const task = await getDocument("tasks", taskID);
    const currentUser = await getDocument("users", getCurrentUserID());
    let url = "#";
    if (currentUser.profilePictureURL) {
      url = await getFile(`profile/${currentUser.profilePictureURL}`);
    }
    sendNotification(
      {
        title: "Task Approved!",
        message: `<span>${currentUser.firstName}</span> has approved your <span>${task.name}</span> favour completion!`,
        updateType: "info",
        icon: url,
        link: `../tasks/volunteer-favor.html?taskid=${taskID}`,
        senderID: currentUser.id
      }
      ,task.volunteerID);

    // Display the success modal
    // const approveSuccessModal = document.getElementById("approveSuccessModal");
    // openModal(approveSuccessModal);

    // Create a URLSearchParams object from the current URL
    var urlParams = new URLSearchParams(window.location.search);

    // Get the value of the 'taskid' parameter
    var taskid = urlParams.get("taskid");

    // Construct the URL for the new page with taskid parameter
    var newURL = "../tasks/complete.html?taskid=" + taskid;

    // Display complete favor page
    window.location.href = newURL;
  } catch (error) {
    console.error("Error updating task status:", error);
  }
});

// Link to chat room
contactBtn.addEventListener("click", function () {
  getDocument("tasks", taskID)
    .then((task) => {
      let loginUserID = getCurrentUserID();
      let volunteerID = task.volunteerID;
      let chatRoomID = [loginUserID, volunteerID].sort().join("-");
      window.location.href = `/chat.html?crid=${chatRoomID}`;
    })
    .catch((error) => {
      console.log(error);
    });
});

// TODO: Link to volunteer profile
// const profileLink = document.getElementById("profileLink");
// profileLink.addEventListener("click", () => {
//   getDocument("tasks", taskID)
//   .then((task) => {
//     let volunteerID = task.volunteerID;
//     window.location.href = `/profile.html?profile=${volunteerID}`;
//   })
//   .catch((error) => {
//     console.log(error);
//   });
// });