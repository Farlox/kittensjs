class ViewModel {
    constructor(needs) {
        this.list = ['wood', 'minerals', 'coal', 'manpower', 'science'];
        this.getRatio = (res, needs) => needs.get(res) ? (needs.get(res) / this.totalNeeded) * 100 : 0;
        this.totalNeeded = this.list.reduce((tot, next) => tot + (needs.get(next) ? needs.get(next) : 0), 0);
        this.wood = this.getRatio('wood', needs);
        this.minerals = this.getRatio('minerals', needs);
        this.coal = this.getRatio('coal', needs);
        this.manpower = this.getRatio('manpower', needs);
        this.science = this.getRatio('science', needs);
    }
}
class View {
    constructor() {
        const left = $('#leftColumnViewport');
        this.panel = $("<div id='kcode'><div id='mode' /><div id='k-options'>" +
            // "<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
            // "<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
            // "<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
            "</div><div id='k-msg' /><div id='k-bld' />" +
            "<div id='k-needs'><div id='k-wood' class='bar'>wood</div><div id='k-minerals' class='bar'>minerals</div><div id='k-coal' class='bar'>coal</div><div id='k-catpower' class='bar'>catpower</div><div id='k-science' class='bar'>science</div></div>" +
            '</div>');
        this.panel.append('<style>#kcode { margin-left: 4px; }' +
            "#kcode #mode::before { color: #808080; content: 'mode: ';}" +
            '#kcode #k-msg { margin-top: 5px; }' +
            '#kcode #k-options { margin-top: 5px; }' +
            '#kcode #k-bld { margin-top: 5px; color: #808080; }' +
            '#kcode #k-needs .bar { background-color:#ccc; color:#333 }' +
            '</style>');
        left.append(this.panel);
    }
    set msg(msg) {
        $('#k-msg').html(msg);
    }
    set model(model) {
        $('#k-wood').css('width', model.wood);
        $('#k-minerals').css('width', model.minerals);
        $('#k-coal').css('width', model.coal);
        $('#k-catpower').css('width', model.manpower);
        $('#k-science').css('width', model.science);
    }
}
