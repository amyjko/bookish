let smoothlyScrollElementToEyeLevel = (el) => {
    // Top of the target minus a third of window height.
    window.scrollTo({ top: el.getBoundingClientRect().top - window.innerHeight / 3 + window.pageYOffset, behavior: 'smooth' }); 
}

export { smoothlyScrollElementToEyeLevel }