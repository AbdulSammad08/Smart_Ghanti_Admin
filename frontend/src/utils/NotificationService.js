import Swal from 'sweetalert2';

/**
 * Centralized Notification Service using SweetAlert2
 * Provides professional, reusable notification methods for the admin portal
 */

export const NotificationService = {
  /**
   * Success notification - for completed actions
   * @param {string} title - Notification title
   * @param {string} message - Optional detailed message
   * @param {number} timer - Auto-close timer in milliseconds (default: 3000)
   */
  success: (title, message = '', timer = 3000) => {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Error notification - for failed actions
   * @param {string} title - Notification title
   * @param {string} message - Optional detailed message
   * @param {number} timer - Auto-close timer in milliseconds (default: 5000)
   */
  error: (title, message = '', timer = 5000) => {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Info notification - for new records or updates
   * @param {string} title - Notification title
   * @param {string} message - Optional detailed message
   * @param {number} timer - Auto-close timer in milliseconds (default: 3000)
   */
  info: (title, message = '', timer = 3000) => {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Warning notification - for pending actions or confirmations
   * @param {string} title - Notification title
   * @param {string} message - Optional detailed message
   * @param {number} timer - Auto-close timer in milliseconds (default: 3500)
   */
  warning: (title, message = '', timer = 3500) => {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Confirmation dialog - for destructive actions like delete
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message/description
   * @param {string} confirmText - Confirm button text (default: "Yes, delete it!")
   * @param {string} cancelText - Cancel button text (default: "Cancel")
   * @returns {Promise} - Resolves to true if confirmed, false if cancelled
   */
  confirm: (title, message, confirmText = 'Yes, delete it!', cancelText = 'Cancel') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    }).then((result) => {
      return result.isConfirmed;
    });
  },

  /**
   * New record/data notification - for real-time updates
   * @param {string} recordType - Type of record (e.g., "Payment", "Transfer Request")
   * @param {string} userName - Name of user associated with record
   * @param {number} timer - Auto-close timer in milliseconds (default: 4000)
   */
  newRecord: (recordType, userName = '', timer = 4000) => {
    const title = `📬 New ${recordType} Received`;
    const message = userName ? `from ${userName}` : '';
    return Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Data loading notification - for real-time data fetch alerts
   * @param {string} message - Custom message (default: "Loading data...")
   */
  loading: (message = 'Loading data...') => {
    return Swal.fire({
      title: message,
      html: 'Please wait...',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  /**
   * Close any open notification/dialog
   */
  close: () => {
    return Swal.close();
  },

  /**
   * Data synchronized notification - for successful data updates
   * @param {string} message - Custom message
   * @param {number} timer - Auto-close timer in milliseconds (default: 2000)
   */
  dataUpdated: (message = 'Data updated successfully', timer = 2000) => {
    return Swal.fire({
      icon: 'success',
      title: '✅ Data Updated',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Record deleted notification
   * @param {string} recordType - Type of record deleted
   * @param {number} timer - Auto-close timer in milliseconds (default: 2500)
   */
  deleted: (recordType = 'Record', timer = 2500) => {
    return Swal.fire({
      icon: 'success',
      title: `✅ ${recordType} Deleted`,
      text: `${recordType} has been successfully deleted`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Record created notification
   * @param {string} recordType - Type of record created
   * @param {number} timer - Auto-close timer in milliseconds (default: 2500)
   */
  created: (recordType = 'Record', timer = 2500) => {
    return Swal.fire({
      icon: 'success',
      title: `✅ ${recordType} Created`,
      text: `New ${recordType} has been successfully created`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Record updated notification
   * @param {string} recordType - Type of record updated
   * @param {number} timer - Auto-close timer in milliseconds (default: 2500)
   */
  updated: (recordType = 'Record', timer = 2500) => {
    return Swal.fire({
      icon: 'success',
      title: `✅ ${recordType} Updated`,
      text: `${recordType} has been successfully updated`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Record approved notification
   * @param {string} recordType - Type of record approved
   * @param {number} timer - Auto-close timer in milliseconds (default: 2500)
   */
  approved: (recordType = 'Request', timer = 2500) => {
    return Swal.fire({
      icon: 'success',
      title: `✅ ${recordType} Approved`,
      text: `${recordType} has been successfully approved`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Record rejected notification
   * @param {string} recordType - Type of record rejected
   * @param {number} timer - Auto-close timer in milliseconds (default: 2500)
   */
  rejected: (recordType = 'Request', timer = 2500) => {
    return Swal.fire({
      icon: 'info',
      title: `⚠️ ${recordType} Rejected`,
      text: `${recordType} has been rejected`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  },

  /**
   * Custom notification with full control
   * @param {Object} options - SweetAlert2 options object
   */
  custom: (options) => {
    return Swal.fire(options);
  }
};

export default NotificationService;
