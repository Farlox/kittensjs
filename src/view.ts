class ViewModel {
    private list: ResourceName[] = ['wood', 'minerals', 'coal', 'manpower', 'science'];

    constructor(needs: Map<ResourceName, number>) {
        this.totalNeeded = this.list.reduce((tot, next) => tot + (needs.get(next) ? needs.get(next) : 0), 0);
        this.wood = this.getRatio('wood', needs);
        this.minerals = this.getRatio('minerals', needs);
        this.coal = this.getRatio('coal', needs);
        this.manpower = this.getRatio('manpower', needs);
        this.science = this.getRatio('science', needs);
    }

    private getRatio = (res: ResourceName, needs: Map<ResourceName, number>) =>
        needs.get(res) ? (needs.get(res) / this.totalNeeded) * 100 : 0;

    public readonly totalNeeded: number;
    public readonly wood: number;
    public readonly minerals: number;
    public readonly coal: number;
    public readonly manpower: number;
    public readonly science: number;
}

class View {
    private panel: HTMLDivElement;

    constructor() {
        const left = $('#leftColumnViewport');

        this.panel = $(
            "<div id='kcode'>" +
                // "<div id='mode' />
                "<div id='k-options'>" +
                "<input id='k-master-toggle' name='k-master-toggle' type='checkbox' checked='true' /><label for='k-master-toggle'>master switch</label><br/>" +
                // "<input id='k-manuscript-toggle' name='k-manuscript-toggle' type='checkbox' /><label for='k-manuscript-toggle'>make manuscripts</label><br/>" +
                // "<input id='k-compendium-toggle' name='k-compendium-toggle' type='checkbox' /><label for='k-compendium-toggle'>make compendiums</label><br/>" +
                // "<input id='k-blueprint-toggle' name='k-blueprint-toggle' type='checkbox' /><label for='k-blueprint-toggle'>make blueprints</label><br/>" +
                '</div>' +
                "<div id='k-msg' /><div id='k-bld' />" +
                "<div id='k-needs'>" +
                "<div id='k-wood' class='bar'>wood</div>" +
                "<div id='k-minerals' class='bar'>minerals</div>" +
                "<div id='k-science' class='bar'>science</div>" +
                "<div id='k-coal' class='bar'>coal</div>" +
                "<div id='k-catpower' class='bar'>catpower</div>" +
                '</div>'
        );

        this.panel.append(
            '<style>#kcode { margin-left: 4px; }' +
                "#kcode #mode::before { color: #808080; content: 'mode: ';}" +
                '#kcode #k-msg { margin-top: 5px; }' +
                '#kcode #k-options { margin-top: 5px; }' +
                '#kcode #k-bld { margin-top: 5px; color: #808080; }' +
                '#kcode #k-needs .bar { background-color:#ccc; color:#333 }' +
                '.craftTable { padding-bottom: 0 !important }' +
                '</style>'
        );

        left.append(this.panel);
    }

    public set msg(msg: string) {
        $('#k-msg').html(msg);
    }

    public get masterEnabled(): boolean {
        const toggle: HTMLInputElement = $('#k-master-toggle')[0];
        return toggle && toggle.checked;
    }

    public set jobRatios(ratios: JobRatio[]) {
        this.msg = ratios
            .map((jr, i, a) => `${(jr.ratio / a[a.length - 1].ratio).toFixed(2)} ${jr.job.name}`)
            .join('<br/>');
    }

    public set model(model: ViewModel) {
        $('#k-wood').css('width', model.wood);
        $('#k-minerals').css('width', model.minerals);
        $('#k-coal').css('width', model.coal);
        $('#k-catpower').css('width', model.manpower);
        $('#k-science').css('width', model.science);
    }
}
