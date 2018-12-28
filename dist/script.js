var nowIndex = 0, maxIndex = 6
setTimeout(() => {
  nextpage()
}, 300);
function nextpage() {
  var oldIndex = nowIndex
  nowIndex = nowIndex == maxIndex ? 1 : nowIndex + 1
  document.querySelector('.page-' + nowIndex).className = 'page-' + nowIndex + ' show-page'
  document.querySelector('.card-p-' + nowIndex).className = 'card-p card-p-' + nowIndex + ' card-in-view'
  if (oldIndex) {
    document.querySelector('.page-' + oldIndex).className = 'page-' + oldIndex + ' hide-page'
    document.querySelector('.card-p-' + oldIndex).className = 'card-p card-p-' + oldIndex + ' card-out-view'
  }
}

initChart()
function initChart() {
  initP2Chart()
  initP3Chart()
  initP4Info()
  initP5Chart()
}

var pageWidth = document.querySelector('.page-1').offsetWidth
function initP2Chart() {
  fetch('json/user-alive.json').then(function(data) {
    return data.json()
  }).then(function(data) {
    var chart = new G2.Chart({
      container: 'p2-chart',
      forceFit: true,
      height: ~~(pageWidth * 0.4),
      padding: 24
    })
    chart.source(data, {
      '0': {
        type: 'cat',
        values: '一二三四五六日'.split('')
      },
      '1': {
        type: 'cat'
      }
    })
    chart.tooltip(false)
    chart.legend(false)
    chart.axis('1', {
      line: null,
      tickLine: null,
      grid: null,
      label: {
        offset: 12,
        textStyle: {
          textAlign: 'end'
        },
        formatter(text, item, index) {
          return text % 2 ? '' : text
        }
      }
    })
    chart.polygon().position('1*0').color('2', '#BAE7FF-#1890FF-#0050B3')
    chart.render()
  })
}

function initP3Chart() {
  function getTextAttrs(cfg) {
    return _.assign({}, {
      fillOpacity: cfg.opacity,
      fontSize: cfg.origin._origin.size,
      rotate: cfg.origin._origin.rotate,
      text: cfg.origin._origin.text,
      textAlign: 'center',
      fontFamily: cfg.origin._origin.font,
      fill: cfg.color,
      textBaseline: 'Alphabetic'
    }, cfg.style);
  }
  G2.Shape.registerShape('point', 'cloud', {
    drawShape: function drawShape(cfg, container) {
      var attrs = getTextAttrs(cfg);
      return container.addShape('text', {
        attrs: _.assign(attrs, {
          x: cfg.x,
          y: cfg.y
        })
      });
    }
  });
  fetch('json/keyword.json').then(function(data) {
    return data.json()
  }).then(function(data) {
    var dv = new DataSet.View().source(data);
    var range = dv.range('1');
    var min = range[0];
    var max = range[1];
    dv.transform({
      type: 'tag-cloud',
      fields: ['0', '1'],
      size: [pageWidth, pageWidth],
      font: 'Verdana',
      padding: 0,
      timeInterval: 5000,
      fontSize: function fontSize(d) {
        if (d.value) {
          return (d.value - min) / (max - min) * (80 - 24) + 24;
        }
        return 0;
      }
    });
    var chart = new G2.Chart({
      container: 'p3-chart',
      forceFit: true,
      height: pageWidth,
      padding: 0
    });
    chart.source(dv, {
      '0': {
        nice: false
      },
      '1': {
        nice: false
      }
    });
    chart.legend(false);
    chart.axis(false);
    chart.tooltip({
      showTitle: false
    });
    chart.coord().reflect();
    chart.point().position('x*y').style({ fill: '#666' }).shape('cloud').tooltip(null);
    chart.render();
  })
}

function initP4Info() {
  fetch('json/top-ten.json').then(function(data) {
    return data.json()
  }).then(function(data) {
    var html = ''
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      html += '<p><a href="https://www.v2ex.com/amp/t/' + item[0] + '" target="_blank">' + item[1] + '</a></p>'
    }
    document.querySelector('#p4-contaner').innerHTML = html
  })
}

function initP5Chart() {
  fetch('json/hot-reply-section.json').then(function(data) {
    return data.json()
  }).then(function(data) {
    var chart = new G2.Chart({
      container: 'p5-chart',
      forceFit: true,
      height: pageWidth,
      padding: [0, 0, 0, 100]
    })
    chart.source(data);
    chart.axis('0', {
      tickLine: {
        alignWithLabel: false,
        length: 0
      },
      line: {
        lineWidth: 0
      }
    });
    chart.axis('1', {
      label: null,
      title: {
        offset: 30,
        textStyle: {
          fontSize: 12,
          fontWeight: 300
        }
      }
    });
    chart.legend(false);
    chart.coord().transpose();
    chart.interval().position('0*1').size(20).opacity(1)
      
    chart.render();
  })
}