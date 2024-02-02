var closeModal = document.getElementsByClassName("close")[0]; // 닫기 버튼 선택
closeModal.onclick = function () {
	var imageModal = document.getElementById('imageModal');
	imageModal.style.display = "none";
}

// 모달 외부 클릭 시 모달 닫기
window.onclick = function (event) {
	var imageModal = document.getElementById('imageModal');
	if (event.target == imageModal) {
		imageModal.style.display = "none";
	}
}