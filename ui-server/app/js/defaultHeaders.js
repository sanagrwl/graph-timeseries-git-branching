function selectedBranchName() {
    return $("#branchList").val();
}

function defaultHeaders() {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const branchName = selectedBranchName();
    if (!!branchName) {
        headers.append("X-Branch", selectedBranchName());
    }

    return headers;
}

module.exports = defaultHeaders;
