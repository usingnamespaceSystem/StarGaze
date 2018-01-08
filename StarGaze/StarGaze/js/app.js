Ext.application({
    name: 'StarGaze',
    launch: function () {
        var tree = Ext.create('Ext.tree.Panel', {
            id: 'tree',
            renderTo: document.body,
            title: 'Цели и стратегические направления развития предприятия',
            rootVisible: false,
            flex: 1,
            layout: {
                type: 'hbox',
                align: 'stretch'    
            },
            plugins: [{
                ptype: 'cellediting'
            }],
            tbar: [{
                xtype: 'toolbar',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                defaults : {
                    flex : 1  
                },
                items: [
                    {
                        text: 'Добавить',
                        handler: function () {
                            var node = Ext.getCmp('tree').getSelectionModel().getSelected().items[0];
                            if (node && node.parentNode.id == 'root') {
                                node.appendChild(
                                    {
                                        leaf: true,
                                        space_name: '',
                                        purpose: '',
                                        perc: '',
                                        direction: ''
                                    }
                                )
                                node.parentNode.expand();
                            }
                        }
                    },
                    {
                        text: 'Удалить',
                        handler: function () {
                            var node = Ext.getCmp('tree').getSelectionModel().getSelected().items[0];

                            if (node && node.parentNode.id != 'root') {
                                node.parentNode.removeChild(node);
                            }
                        }
                    },
                    {
                        text: 'Готово',
                        handler: function () {
                            var root = Ext.getCmp('tree').getRootNode(),
                                json = [];

                            for (var i = 0; i < root.childNodes.length; i++) {
                                var category = root.childNodes[i],
                                    category_name = category.data.category,
                                    global_dirs = [];

                                json.push({});
                                json[i]['name'] = category_name;
                                json[i]['items'] = [];

                                for (var j = 0; j < category.childNodes.length; j++) {
                                    var category_dirs = category.childNodes[j].data.direction ? category.childNodes[j].data.direction.split("\n") : [],
                                        perc = category.childNodes[j].data.perc,
                                        name = category.childNodes[j].data.space_name,
                                        purpose = category.childNodes[j].data.purpose;

                                    json[i]['items'].push({});
                                    json[i]['items'][j]['name'] = name;
                                    json[i]['items'][j]['percentage'] = perc;
                                    json[i]['items'][j]['purpose'] = purpose;
                                    json[i]['items'][j]['direction'] = [];

                                    var tmp = [];
                                    for (var dir in category_dirs) {
                                        if (category_dirs[dir] == '') {
                                            continue;
                                        }
                                        if (tmp.indexOf(category_dirs[dir]) > -1 && global_dirs.indexOf(category_dirs[dir]) > -1) {
                                            continue;
                                        }
                                        else {
                                            tmp.push(category_dirs[dir]);
                                            global_dirs.push(category_dirs[dir]);
                                        }
                                    }

                                    json[i]['items'][j]['direction'] = tmp;
                                }
                            }
                            Ext.util.Cookies.set('purposes', JSON.stringify(json));
                            var cookie = Ext.util.Cookies.get('csrftoken');
                            Ext.Ajax.request({
                                url: '/directions',
                                jsonData: json,
                                headers: {
                                    'X-CSRFToken': cookie
                                },
                                success: function (response, opts) {
                                    var directions;

                                    if (load) {
                                        directions = only_dirs;
                                    }
                                    else {
                                        directions = JSON.parse(response.responseText);
                                    }

                                    Ext.getCmp('tree').hide();

                                    Ext.create('Ext.data.Store', {
                                        storeId: 'directions',
                                        fields: ['name', 'group'],
                                        data: directions
                                    });

                                    if (!Ext.getCmp('dir')) {
                                        Ext.create('Directions', {
                                            store: Ext.data.StoreManager.lookup('directions')
                                        });
                                    }
                                    else {
                                        show_group_dirs();
                                        Ext.getCmp('dir').getView().refresh();
                                    }
                                }
                            });
                        }
                    }]
            }],
            fields: [
                'category',
                'space_name',
                'purpose',
                'perc',
                'direction'
            ],
            columns: [{
                xtype: 'treecolumn',
                text: 'Категория пространства',
                dataIndex: 'category',
                flex: 1,
                sortable: true
            },
            {
                text: 'Наименование пространства',
                dataIndex: 'space_name',
                flex: 1,
                sortable: true,
                editor: {
                    xtype: 'textfield',
                    emptyText: 'Введите наименование пространства'
                }
            },
            {
                text: 'Наименование целей',
                dataIndex: 'purpose',
                flex: 1,
                sortable: true,
                editor: {
                    xtype: 'textfield',
                    emptyText: 'Введите наименование целей'
                }
            },
            {
                text: 'Количественная оценка цели',
                dataIndex: 'perc',
                flex: 1,
                sortable: true,
                editor: {
                    xtype: 'textfield',
                    emptyText: 'Введите количетвенную оценку цели'
                }
            },
            {
                text: 'Стратегические направления, реализующие цели',
                dataIndex: 'direction',
                flex: 1,
                sortable: true,
                editor: {
                    xtype: 'textareafield',
                    grow: true,
                    anchor: '100%',
                    emptyText: 'Перечислите стратегические направления'
                },
                renderer: function (val, e, record) {
                    return Ext.util.Format.nl2br(val);
                }
            }],
            root: {
                expanded: true,
                children: [{
                    category: 'Цели, инициируемые вышестоящей системой',
                    expanded: true
                },
                {
                    category: 'Цели, инициируемые подведомственными системами',
                    expanded: true
                },
                {
                    category: 'Цели, инициируемые существенной средой',
                    expanded: true
                },
                {
                    category: 'Цели, инициируемые исследуемой системой',
                    expanded: true
                }]
            }
        });

        tree.on('beforeedit', function (editor, e, eOpts) {
            var node = Ext.getCmp('tree').getSelectionModel().getSelected().items[0];

            if (node.parentNode.id == 'root') {
                return false;
            }
            return true;
        });

        tree.on('edit', function (editor, e, eOpts) {
            this.getView().refresh()
            
            return true;
        });

        var textarea = document.querySelector('textarea');

        if (textarea)
            textarea.addEventListener('keydown', autosize);
    }
});

Ext.define('Directions', {
    id: 'dir',
    extend: 'Ext.grid.Panel',
    title: 'Сгруппированные стратегические направления развития',
    plugins: [{
        ptype: 'cellediting'
    }],
    tbar: [
        {
            text: 'Готово',
            handler: function () {
                var store = Ext.getCmp('dir').store.getData().items,
                    json = JSON.parse(Ext.util.Cookies.get('purposes'));

                if (!load) {
                    for (var c = 0; c < store.length; c++) {
                        var item = store[c].getData(),
                            direction = item.name,
                            group = item.group;

                        for (var i = 0; i < json.length; i++) {
                            var items = json[i].items;

                            for (var j = 0; j < items.length; j++) {
                                var row = items[j];

                                for (var index in row['direction']) {
                                    var dir = row['direction'][index];

                                    if (dir == direction) {
                                        row['direction'][index] = {
                                            'name': dir,
                                            'group': group
                                        };
                                        only_dirs.push({
                                            'name': dir,
                                            'group': group
                                        });
                                    }
                                }
                            }
                        }
                    }


                    only_dirs.sort(function (a, b) {
                        map = {
                            "Финансы": 0,
                            "Клиенты и продукты": 1,
                            "Бизнес-процессы": 2,
                            "Обучение и рост": 3
                        };

                        if (map[a.group] > map[b.group]) {
                            return 1;
                        }
                        if (map[a.group] < map[b.group]) {
                            return -1;
                        }

                        return 0;
                    });

                    Ext.util.Cookies.set('purposes', JSON.stringify(json));
                }

                Ext.getCmp('dir').hide();

                Ext.create('Ext.panel.Panel', {
                    id: 'select',
                    renderTo: Ext.getBody(),
                    scope: this,

                    layout: {
                        type: 'vbox'
                    },
                    items: [
                        {
                            xtype: 'label',
                            id: 'text',
                            text: create_select_text()
                        },
                        {
                            xtype: 'button',
                            text: 'Да',
                            handler: yes
                        },
                        {
                            xtype: 'button',
                            text: 'Нет',
                            handler: no
                        },
                        {
                            xtype: 'button',
                            text: 'Назад',
                            handler: back
                        },
                        {
                            xtype: 'button',
                            text: 'Завершить',
                            handler: function () {
                                this.up().hide();

                                var columns = [],
                                    fields = [],
                                    data = [];

                                if (!document.getElementById('matrix')) {
                                    var div = document.createElement('div');
                                    div.id = 'div';
                                    var matrix = document.createElement('table');
                                    matrix.id = 'matrix';
                                    var name = document.createElement('th');
                                    name.innerText = '  ';

                                    matrix.appendChild(name);

                                    for (var j = 0; j < only_dirs.length; j++) {
                                        var th = document.createElement('th');
                                        th.innerText = only_dirs[j].name;
                                        matrix.appendChild(th);
                                    }

                                    for (var i = 0; i < only_dirs.length; i++) {
                                        var tr = document.createElement('tr');
                                        var td = document.createElement('td');

                                        td.innerHTML = only_dirs[i].name;
                                        tr.appendChild(td);

                                        for (var j = 0; j < only_dirs.length; j++) {
                                            var col_td = document.createElement('td');
                                            if (only_dirs[i]['influences'].indexOf(only_dirs[j]['name']) > -1) {
                                                col_td.innerText = "+";
                                            }
                                            col_td.onclick = function (e) {
                                                if (this.innerText == '+') {
                                                    var name = this.parentElement.parentElement.getElementsByTagName('th')[this.cellIndex].innerText,
                                                        index = only_dirs[this.parentElement.rowIndex]['influences'].indexOf(name);

                                                    if (index != -1) {
                                                        only_dirs[this.parentElement.rowIndex]['influences'].splice(index, 1);
                                                        this.innerText = '';
                                                    }
                                                }
                                                else {
                                                    var name = this.parentElement.parentElement.getElementsByTagName('th')[this.cellIndex].innerText;

                                                    only_dirs[this.parentElement.rowIndex]['influences'].push(name);
                                                    this.innerText = '+';

                                                }
                                            };
                                            tr.appendChild(col_td);
                                        }

                                        matrix.appendChild(tr);
                                    }

                                    div.appendChild(matrix);
                                    document.documentElement.appendChild(div);

                                    Ext.create('Ext.Button', {
                                        id: 'next_step',
                                        text: 'Готово',
                                        style: {
                                            'background-color': '#475361',
                                            'border-color': '#e4e4e4',
                                            'color': '#d0d0d0'
                                        },
                                        renderTo: Ext.getBody(),
                                        handler: function () {
                                            {
                                                matrix.style.visibility = false;

                                                var data = {
                                                    "nodes": [],
                                                    "edges": [],
                                                };

                                                for (var i = 0; i < only_dirs.length; i++) {
                                                    data['nodes'].push({
                                                        "id": i,
                                                        "title": only_dirs[i]["name"],
                                                        "node_type": only_dirs[i]["group"],
                                                        "type": only_dirs[i]["group"],
                                                    });

                                                    for (var j = 0; j < only_dirs[i]["influences"].length; j++) {
                                                        var influence = only_dirs[i]["influences"][j];
                                                        data["edges"].push({
                                                            "source": i,
                                                            "target": only_dirs.findIndex(p => p.name == influence)
                                                        });
                                                    }
                                                }

                                                var alch = document.getElementById("alchemy");
                                                while (alch.childElementCount > 0)
                                                    alch.removeChild(alch.firstElementChild);

                                                alchemy = new Alchemy({
                                                    dataSource: data,
                                                    nodeCaption: "title",
                                                    nodeCaptionsOnByDefault: true,
                                                    directedEdges: true,
                                                    linkDistance: 2000,
                                                    nodeTypes: {
                                                        "type":
                                                            ["Финансы", "Клиенты и продукты", "Обучение и рост", "Бизнес-процессы"]
                                                    },
                                                    nodeStyle: {
                                                        "all": {
                                                            "borderWidth": function (d, radius) {
                                                                return radius / 30;
                                                            },
                                                            "radius": function (d) {
                                                                return 50;
                                                            },
                                                        },
                                                        "Финансы": {
                                                            "borderColor": "rgba(0, 0, 103, 1)",
                                                            "color": "rgba(0, 0, 103, 0.50)",
                                                            "selected": {
                                                                "color": "#ffffff",
                                                            },
                                                            "highlighted": {
                                                                "color": "#b4dcff"
                                                            }
                                                        },
                                                        "Клиенты и продукты": {
                                                            "borderColor": "rgba(198, 40, 40, 1)",
                                                            "color": "rgba(198, 40, 40, 0.50)",
                                                            "selected": {
                                                                "color": "#ffffff",
                                                            },
                                                            "highlighted": {
                                                                "color": "#EF9A9A"
                                                            }
                                                        },
                                                        "Обучение и рост": {
                                                            "borderColor": "rgba(46, 125, 50, 1)",
                                                            "color": "rgba(46, 125, 50, 0.50)",
                                                            "selected": {
                                                                "color": "#ffffff",
                                                            },
                                                            "highlighted": {
                                                                "color": "#43A047"
                                                            }
                                                        },
                                                        "Бизнес-процессы": {
                                                            "borderColor": "rgba(255, 145, 0, 1)",
                                                            "color": "rgba(255, 145, 0, 0.50)",
                                                            "selected": {
                                                                "color": "#ffffff",
                                                            },
                                                            "highlighted": {
                                                                "color": "#FFD180"
                                                            }
                                                        }
                                                    },
                                                    edgeStyle: {
                                                        "all": {
                                                            "width": function (d) {
                                                                return 5
                                                            }
                                                        }
                                                    }
                                                });

                                                var labels = [],
                                                finances = [],
                                                clients = [],
                                                grow = [],
                                                business = [],
                                                colors = {
                                                    "Финансы": [],
                                                    "Клиенты и продукты": [],
                                                    "Обучение и рост": [],
                                                    "Бизнес-процессы": []
                                                };

                                                for (var i = 0; i < only_dirs.length; i++) {
                                                    finances.push(1);
                                                    clients.push(2);
                                                    grow.push(3);
                                                    business.push(4);
                                                    colors["Финансы"].push("transparent");
                                                    colors["Клиенты и продукты"].push("transparent");
                                                    colors["Обучение и рост"].push("transparent");
                                                    colors["Бизнес-процессы"].push("transparent");
                                                }

                                                for (var i = 0; i < only_dirs.length; i++) {
                                                    labels.push(only_dirs[i]["name"]);

                                                    for (var j = 0; j < only_dirs[i]["influences"].length; j++) {
                                                        var influence = only_dirs[i]["influences"][j],
                                                            index = only_dirs.findIndex(p => p.name == influence);

                                                        colors[only_dirs[i]["group"]][i] = 'black';

                                                        if (only_dirs[index]["group"] != only_dirs[i]["group"]) {
                                                            colors[only_dirs[index]["group"]][i] = 'grey';
                                                            colors[only_dirs[i]["group"]][index] = 'white';
                                                        }
                                                    }
                                                }

                                                var keys = [];

                                                for (var i = 0; i < only_dirs.length; i++) {
                                                    if (colors["Финансы"][i] != "transparent" && colors["Клиенты и продукты"][i] != "transparent"
                                                        && colors["Обучение и рост"][i] != "transparent" && colors["Бизнес-процессы"][i] != "transparent") {
                                                        keys.push(only_dirs[i]);
                                                    }
                                                }

                                                var config = {
                                                    type: 'radar',
                                                    data: {
                                                        labels: labels,
                                                        datasets: [
                                                            {
                                                                label: "Финансы",
                                                                borderColor: "rgba(0, 0, 103, 1)",
                                                                pointBackgroundColor: colors["Финансы"],
                                                                pointBorderColor: 'transparent',
                                                                pointBorderWidth: 2,
                                                                radius: 7,
                                                                fill: false,
                                                                data: finances
                                                            },
                                                            {
                                                                label: "Клиенты и продукты",
                                                                borderColor: "rgba(198, 40, 40, 1)",
                                                                pointBackgroundColor: colors["Клиенты и продукты"],
                                                                pointBorderColor: 'transparent',
                                                                pointBorderWidth: 2,
                                                                radius: 7,
                                                                fill: false,
                                                                data: clients
                                                            },
                                                            {
                                                                label: "Бизнес-процессы",
                                                                borderColor: "rgba(255, 145, 0, 1)",
                                                                pointBackgroundColor: colors["Бизнес-процессы"],
                                                                pointBorderColor: 'transparent',
                                                                pointBorderWidth: 2,
                                                                radius: 7,
                                                                fill: false,
                                                                data: business
                                                            },
                                                            {
                                                                label: "Обучение и рост",
                                                                borderColor: "rgba(46, 125, 50, 1)",
                                                                pointBackgroundColor: colors["Обучение и рост"],
                                                                pointBorderColor: 'transparent',
                                                                pointBorderWidth: 2,
                                                                radius: 7,
                                                                fill: false,
                                                                data: grow
                                                            }
                                                        ]
                                                    },
                                                    options: {
                                                        legend: {
                                                            position: 'top',
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Карта звездного неба'
                                                        },
                                                        scale: {
                                                            ticks: {
                                                                beginAtZero: true,
                                                                display: false
                                                            }
                                                        }
                                                    }
                                                };

                                                window.myRadar = new Chart(document.getElementById("canvas"), config);
                                                var div = document.createElement('div');
                                                div.id = 'canvas_div';
                                                div.innerHTML = "<span>" + "Ключевые элементы:" + "</span><br/>";

                                                keys.forEach(function (el) {
                                                    div.innerHTML += "<span>" + el["name"] + "</span>" + "<br/>";
                                                });

                                                document.documentElement.appendChild(div);
                                                show_strat_map();
                                            };
                                        }
                                    });

                                    
                                }
                                else {
                                    show_table();
                                }
                            }
                        }
                    ]
                });
            }
        }
    ],
    columns: [
        {
            text: 'Направление',
            dataIndex: 'name',
            flex: 1
        },
        {
            text: 'Группа',
            dataIndex: 'group',
            flex: 1,
            editor: {
                xtype: 'radiogroup',
                columns: 4,
                simpleValue: true,
                items: [{
                    boxLabel: 'Финансы',
                    name: 'dir',
                    inputValue: 'Финансы'
                }, {
                    boxLabel: 'Клиенты и продукты',
                    name: 'dir',
                    inputValue: 'Клиенты и продукты'
                }, {
                    boxLabel: 'Обучение и рост',
                    name: 'dir',
                    inputValue: 'Обучение и рост'
                }, {
                    boxLabel: 'Бизнес-процессы',
                    name: 'dir',
                    inputValue: 'Бизнес-процессы'
                }]
            }
        }
    ],
    renderTo: Ext.getBody()
});


var row_count = 0,
    col_count = 1,
    begin_col = 0,
    select_map = {
        "Финансы": ["Финансы"],
        "Клиенты и продукты": ["Финансы", "Клиенты и продукты"],
        "Бизнес-процессы": ["Финансы", "Клиенты и продукты", "Бизнес-процессы"],
        "Обучение и рост": ["Бизнес-процессы", "Клиенты и продукты", "Обучение и рост"]
    },
    only_dirs = [],
    load = false;

var create_select_text = function () {
    for (var j = 0; j < only_dirs.length; j++) {
        var constrains = select_map[only_dirs[row_count]["group"]];

        if (constrains.includes(only_dirs[j]["group"]) && only_dirs[row_count]['name'] != only_dirs[j]['name']) {
            col_count = j;
            begin_col = j;
            return 'Влияет ли ' + only_dirs[row_count]['name'] + ' на ' + only_dirs[j]['name'] + '? (' + only_dirs[row_count]['group'] + ' - ' + only_dirs[col_count]['group'] + ')';
        }
    }
    return "Ошибка";
}

var yes = function () {
    if (!('influences' in only_dirs[row_count])) {
        only_dirs[row_count]['influences'] = [];
    }

    only_dirs[row_count]['influences'].push(only_dirs[col_count]['name']);

    next();
}

var no = function () {
    if (!('influences' in only_dirs[row_count])) {
        only_dirs[row_count]['influences'] = [];
    }

    only_dirs[row_count]['influences'].splice(only_dirs[row_count]['influences'].indexOf(only_dirs[col_count]['name']));

    next();
}

var back = function () {
    if (col_count > 0) {
        col_count--;
        if (row_count == col_count) {
            if (col_count > 0) {
                col_count--;
            }
            else if (row_count > 0) {
                col_count = only_dirs.length;
                row_count--;
                back();
            }
            else {
                row_count = 0;
                col_count = begin_col;
                Ext.getCmp('text').setText('Влияет ли ' + only_dirs[row_count]['name'] + ' на ' + only_dirs[col_count]['name'] + '? (' + only_dirs[row_count]['group'] + ' - ' + only_dirs[col_count]['group'] + ')');
                Ext.Msg.alert('', 'Начало списка');
                return;
            }
        }
    }
    else if (row_count > 0) {
        col_count = only_dirs.length - 1;
        row_count--;
        back();
    }

    var constrains = select_map[only_dirs[row_count]["group"]];
    if (constrains.includes(only_dirs[col_count]["group"]))
        Ext.getCmp('text').setText('Влияет ли ' + only_dirs[row_count]['name'] + ' на ' + only_dirs[col_count]['name'] + '? (' + only_dirs[row_count]['group'] + ' - ' + only_dirs[col_count]['group'] + ')');
    else {
        back();
    }
}

var next = function () {
    if (!('influences' in only_dirs[row_count])) {
        only_dirs[row_count]['influences'] = [];
    }

    if (col_count < only_dirs.length - 1) {
        col_count++;
        if (row_count == col_count) {
            if (col_count < only_dirs.length - 1) {
                col_count++;
            }
            else if (row_count < only_dirs.length - 1) {
                col_count = 0;
                row_count++;
                next();
            }
            else {
                row_count = 0;
                col_count = begin_col;
                Ext.getCmp('text').setText('Влияет ли ' + only_dirs[row_count]['name'] + ' на ' + only_dirs[col_count]['name'] + '? (' + only_dirs[row_count]['group'] + ' - ' + only_dirs[col_count]['group'] + ')');
                Ext.Msg.alert('', 'Завершено');
                return;
            }
        }
    }
    else if (row_count < only_dirs.length - 1) {
        col_count = 0;
        row_count++;
        next();
    }
    else {
        Ext.Msg.alert('', 'Завершено');
        return;
    }

    var constrains = select_map[only_dirs[row_count]["group"]];
    if (constrains.includes(only_dirs[col_count]["group"]))
        Ext.getCmp('text').setText('Влияет ли ' + only_dirs[row_count]['name'] + ' на ' + only_dirs[col_count]['name'] + '? (' + only_dirs[row_count]['group'] + ' - ' + only_dirs[col_count]['group'] + ')');
    else {
        next();
    }

}


function show_purposes_table() {
    Ext.getCmp('dir') ? Ext.getCmp('dir').hide() : false;
    Ext.getCmp('select') ? Ext.getCmp('select').hide() : false;
    document.getElementById('div') ? document.getElementById('div').style.display = 'none' : false;
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').hide() : false;
    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'none' : false;
    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'none' : false;
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'none' : false;

    Ext.getCmp('tree') ? Ext.getCmp('tree').show() : alert("Вы еще не переходили к этому пункту");
}

function show_group_dirs() {
    Ext.getCmp('tree') ? Ext.getCmp('tree').hide() : false;
    Ext.getCmp('select') ? Ext.getCmp('select').hide() : false;
    document.getElementById('div') ? document.getElementById('div').style.display = 'none' : false;
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').hide() : false;
    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'none' : false;
    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'none' : false;
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'none' : false;

    Ext.getCmp('dir') ? Ext.getCmp('dir').show() : alert("Вы еще не переходили к этому пункту");
}

function show_links() {
    Ext.getCmp('tree') ? Ext.getCmp('tree').hide() : false;
    Ext.getCmp('dir') ? Ext.getCmp('dir').hide() : false;
    document.getElementById('div') ? document.getElementById('div').style.display = 'none' : false;
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').hide() : false;
    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'none' : false;
    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'none' : false;
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'none' : false;

    Ext.getCmp('select') ? Ext.getCmp('select').show() : alert("Вы еще не переходили к этому пункту");
}

function show_table() {
    Ext.getCmp('tree') ? Ext.getCmp('tree').hide() : false;
    Ext.getCmp('dir') ? Ext.getCmp('dir').hide() : false;
    Ext.getCmp('select') ? Ext.getCmp('select').hide() : false;
    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'none' : false;
    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'none' : false;
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'none' : false;

    document.getElementById('div') ? document.getElementById('div').style.display = 'block' : alert("Вы еще не переходили к этому пункту");
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').show() : false;
}

function show_strat_map() {
    Ext.getCmp('tree') ? Ext.getCmp('tree').hide() : false;
    Ext.getCmp('dir') ? Ext.getCmp('dir').hide() : false;
    Ext.getCmp('select') ? Ext.getCmp('select').hide() : false;
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').hide() : false;
    document.getElementById('div') ? document.getElementById('div').style.display = 'none' : false;
    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'none' : false;
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'none' : false;

    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'block' : alert("Вы еще не переходили к этому пункту");
}

function show_stars() {
    Ext.getCmp('tree') ? Ext.getCmp('tree').hide() : false;
    Ext.getCmp('dir') ? Ext.getCmp('dir').hide() : false;
    Ext.getCmp('select') ? Ext.getCmp('select').hide() : false;
    Ext.getCmp('next_step') ? Ext.getCmp('next_step').hide() : false;
    document.getElementById('div') ? document.getElementById('div').style.display = 'none' : false;
    document.getElementById('alchemy') ? document.getElementById('alchemy').style.display = 'none' : false;

    document.getElementById('canvas') ? document.getElementById('canvas').style.display = 'block' : alert("Вы еще не переходили к этому пункту");
    document.getElementById('canvas_div') ? document.getElementById('canvas_div').style.display = 'block' : false;
}

function save() {
    var json_data = "data:text/json;charset=utf-8," + Ext.util.Cookies.get('purposes') + "\n" + JSON.stringify(only_dirs);
    var encodedUri = encodeURI(json_data);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "StarGaze.stz");
    document.body.appendChild(link);

    link.click();
}

function upload(event) {
    var json_file = event.target;
        reader = new FileReader();

    
    reader.onload = function () {
        var json_string = reader.result;
        var json_array = json_string.split('\n');
        json_tree = JSON.parse(json_array[0]);
        json_dirs = JSON.parse(json_array[1]);

        load = true;
        only_dirs = json_dirs;

        var root = Ext.getCmp('tree').getRootNode();

        for (var i = 0; i < json_tree.length; i++) {
            var space = json_tree[i];

            for (var j = 0; j < space["items"].length; j++) {
                var item = space["items"][j];
                var str = "";
                for (var dir = 0; dir < item["direction"].length; dir++) {
                    str += item["direction"][dir]['name'] + " \n";
                }

                root.childNodes[i].appendChild({
                    leaf: true,
                    space_name: item["name"],
                    purpose: item["purpose"],
                    perc: item["percentage"],
                    direction: str
                });
            }
        }
    };

    reader.readAsText(json_file.files[0]);
   
}