const burger = () => {
    const iconMenu = document.querySelector(".top__icon-menu");
    const menuLinks = document.querySelectorAll(".top__nav-item");
    const menuBody = document.querySelector(".top__nav");

    if (iconMenu) {
        iconMenu.addEventListener("click", () => {
            iconMenu.classList.toggle("_active");
            menuBody.classList.toggle("_active");
        });
    }

    menuLinks.forEach((link) => {
        link.addEventListener("click", () => {
            menuBody.classList.remove("_active");
            iconMenu.classList.remove("_active");
        });
    });
};

burger();