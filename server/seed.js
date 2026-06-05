import { initDB, get, run, transaction } from './db.js'

const questions = [
  // === ECharts 单选题 5题 ===
  { subject: 'ECharts', type: 'single_choice', question: '在 ECharts 中，以下哪个配置项用于设置图表的标题？', options: JSON.stringify(['A. title', 'B. header', 'C. legend', 'D. tooltip']), answer: 'A', explanation: 'ECharts 使用 title 配置项来设置图表的标题，包含 text、subtext、left、top 等属性。' },
  { subject: 'ECharts', type: 'single_choice', question: 'ECharts 中用于显示鼠标悬浮提示的组件是？', options: JSON.stringify(['A. title', 'B. tooltip', 'C. legend', 'D. toolbox']), answer: 'B', explanation: 'tooltip 组件用于显示鼠标悬浮时的提示信息，可设置 trigger 为 axis 或 item 来触发。' },
  { subject: 'ECharts', type: 'single_choice', question: '在 ECharts 柱状图中，如果要设置柱子的宽度，应使用哪个属性？', options: JSON.stringify(['A. width', 'B. barWidth', 'C. barGap', 'D. itemWidth']), answer: 'B', explanation: 'barWidth 是柱状图中用于设置柱子宽度的属性，可以是数值或百分比。' },
  { subject: 'ECharts', type: 'single_choice', question: 'ECharts 中用于表示数据系列的配置项名称是？', options: JSON.stringify(['A. data', 'B. dataset', 'C. series', 'D. xAxis']), answer: 'C', explanation: 'series 是 ECharts 的核心配置项，用于定义图表的数据系列，包括图表类型、数据、样式等。' },
  { subject: 'ECharts', type: 'single_choice', question: '以下哪个不是 ECharts 支持的图表类型？', options: JSON.stringify(['A. line', 'B. bar', 'C. pie', 'D. histogram']), answer: 'D', explanation: 'histogram（直方图）不是 ECharts 原生支持的图表类型。ECharts 支持 line(折线图)、bar(柱状图)、pie(饼图)、scatter(散点图) 等。' },

  // === ECharts 多选题 5题 ===
  { subject: 'ECharts', type: 'multi_choice', question: 'ECharts 中以下哪些是图表的组成组件？（多选）', options: JSON.stringify(['A. title', 'B. legend', 'C. tooltip', 'D. footer']), answer: 'A,B,C', explanation: 'title(标题)、legend(图例)、tooltip(提示框) 都是 ECharts 的组件。footer 不是 ECharts 的组件。' },
  { subject: 'ECharts', type: 'multi_choice', question: '以下哪些方法可以用于 ECharts 的数据交互？（多选）', options: JSON.stringify(['A. setOption()', 'B. dispatchAction()', 'C. showLoading()', 'D. connect()']), answer: 'A,B', explanation: 'setOption() 用于更新配置，dispatchAction() 用于触发交互行为。' },
  { subject: 'ECharts', type: 'multi_choice', question: '在 ECharts 中，以下哪些属性属于柱状图的样式配置？（多选）', options: JSON.stringify(['A. barWidth', 'B. barBorderRadius', 'C. itemStyle', 'D. smooth']), answer: 'A,B,C', explanation: 'barWidth(柱宽)、barBorderRadius(柱圆角)、itemStyle(图形样式) 都是柱状图样式配置。smooth 是折线图的平滑属性。' },
  { subject: 'ECharts', type: 'multi_choice', question: '以下哪些 ECharts 配置项用于坐标轴配置？（多选）', options: JSON.stringify(['A. xAxis', 'B. yAxis', 'C. legend', 'D. grid']), answer: 'A,B,D', explanation: 'xAxis、yAxis、grid 都用于坐标轴配置。' },
  { subject: 'ECharts', type: 'multi_choice', question: 'ECharts 动画相关的配置项包括？（多选）', options: JSON.stringify(['A. animation', 'B. animationDuration', 'C. animationEasing', 'D. transition']), answer: 'A,B,C', explanation: 'animation、animationDuration、animationEasing 都是动画配置。' },

  // === ECharts 判断题 5题 ===
  { subject: 'ECharts', type: 'true_false', question: 'ECharts 的 legend 组件必须配合 series 中的 name 属性才能正确显示图例。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'legend 图例组件需要读取 series 中的 name 值来显示对应的数据系列名称。' },
  { subject: 'ECharts', type: 'true_false', question: 'ECharts 支持在同一个图表中混合展示折线图和柱状图。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'ECharts 支持混搭图表，通过在 series 数组中设置不同的 type 值即可。' },
  { subject: 'ECharts', type: 'true_false', question: 'ECharts 的 tooltip 组件只能通过鼠标悬停触发。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'B', explanation: 'tooltip 可以通过 dispatchAction 事件来触发，也可以通过 show 方法主动显示。' },
  { subject: 'ECharts', type: 'true_false', question: 'ECharts 中 color 调色盘只能设置一种颜色。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'B', explanation: 'ECharts 的 color 调色盘可以设置一个颜色数组，图表会自动按顺序为各系列分配颜色。' },
  { subject: 'ECharts', type: 'true_false', question: 'ECharts 的 dataset 组件用于直接管理数据，可以替代 series.data。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'dataset 组件提供了数据管理功能，可以通过 encode 属性将数据映射到不同的系列和坐标轴。' },

  // === ECharts 填空题 5题 ===
  { subject: 'ECharts', type: 'fill_blank', question: 'ECharts 中用于绘制折线图的 type 值是 ______。', options: null, answer: 'line', explanation: '设置 series.type 为 "line" 即可绘制折线图。' },
  { subject: 'ECharts', type: 'fill_blank', question: 'ECharts 初始化实例的方法是 echarts.______(dom, theme, opts)。', options: null, answer: 'init', explanation: 'echarts.init() 是初始化 ECharts 实例的静态方法。' },
  { subject: 'ECharts', type: 'fill_blank', question: 'ECharts 配置项中，图表距离容器边界的距离由 ______ 属性控制。', options: null, answer: 'grid', explanation: 'grid 配置项控制图表与容器边界的距离。' },
  { subject: 'ECharts', type: 'fill_blank', question: 'ECharts 饼图中通过设置 ______: "rose" 可以实现南丁格尔玫瑰图效果。', options: null, answer: 'roseType', explanation: '将 series 中的 roseType 设为 "rose" 即可展示为南丁格尔玫瑰图。' },
  { subject: 'ECharts', type: 'fill_blank', question: '在 ECharts 中，多个图表之间通过 ______ 方法可以实现联动交互。', options: null, answer: 'connect', explanation: 'echarts.connect() 方法可以将多个图表实例关联起来。' },
]

async function main() {
  await initDB()

  // 创建管理员账号
  const admin = get('SELECT id FROM users WHERE username = ?', ['admin'])
  if (!admin) {
    const { randomBytes, scryptSync } = await import('crypto')
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync('admin123', salt, 64).toString('hex')
    run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', salt + ':' + hash, 'admin'])
    console.log('✓ 已创建管理员账号（admin / admin123）')
  }

  const existing = get('SELECT COUNT(*) as count FROM questions')
  if (existing.count > 0) {
    console.log(`数据库已有 ${existing.count} 道题目，跳过种子数据`)
    return
  }

  const insert = transaction((items) => {
    for (const item of items) {
      run('INSERT INTO questions (subject, type, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
        [item.subject, item.type, item.question, item.options, item.answer, item.explanation])
    }
  })
  insert(questions)
  console.log(`✓ 已插入 ${questions.length} 道测试题目（科目：ECharts）`)
}

main().catch(console.error)
