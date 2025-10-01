/**
 * プロジェクトカラーパレット
 * Material-UI のカラーパレットから選定した16色
 */
export const PROJECT_COLORS = [
  { name: 'ブルー', value: '#1976d2' },
  { name: 'グリーン', value: '#388e3c' },
  { name: 'レッド', value: '#d32f2f' },
  { name: 'パープル', value: '#7b1fa2' },
  { name: 'オレンジ', value: '#f57c00' },
  { name: 'ティール', value: '#00796b' },
  { name: 'インディゴ', value: '#303f9f' },
  { name: 'ピンク', value: '#c2185b' },
  { name: 'ブラウン', value: '#5d4037' },
  { name: 'グレー', value: '#616161' },
  { name: 'ライトブルー', value: '#0288d1' },
  { name: 'ライトグリーン', value: '#689f38' },
  { name: 'アンバー', value: '#ffa000' },
  { name: 'ディープオレンジ', value: '#e64a19' },
  { name: 'シアン', value: '#0097a7' },
  { name: 'ディープパープル', value: '#512da8' },
] as const;

export type ProjectColor = typeof PROJECT_COLORS[number];
