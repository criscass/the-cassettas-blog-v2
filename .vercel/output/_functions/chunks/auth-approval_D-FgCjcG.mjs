function requiresApproval(status) {
  return status !== "approved";
}
function approvalErrorMessage(status) {
  return status === "rejected" ? "Account was not approved" : "Account pending admin approval";
}

export { approvalErrorMessage as a, requiresApproval as r };
