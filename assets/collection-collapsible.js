$(".collapsible-trigger-btn").click(function () {
    var current_content = '#'+this.getAttribute('aria-controls');
    $(".collapsible-content:not("+current_content+")").removeClass("is-open").removeAttr('style'); 
    $('.collapsible-trigger-btn').not(this).removeClass('is-open');
});