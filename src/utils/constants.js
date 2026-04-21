export const TEST_TYPES = [
  { id: 'EPR',   name: 'EPR（电子顺磁共振）' },
  { id: 'IR',    name: '红外光谱（FTIR）' },
  { id: 'BET',   name: 'BET（比表面积/孔径分析）' },
  { id: 'Raman', name: '拉曼光谱' },
  { id: 'XRD',   name: 'XRD（X射线衍射）' },
  { id: 'TEM',   name: 'TEM（透射电子显微镜）' },
  { id: 'SEM',   name: 'SEM（扫描电子显微镜）' },
  { id: 'TGA',   name: 'TGA（热重分析）' },
  { id: 'NMR',   name: 'NMR（核磁共振）' },
  { id: 'DSC',   name: 'DSC（差示扫描量热）' },
  { id: 'XPS',   name: 'XPS（X射线光电子能谱）' },
  { id: 'other', name: '其他（备注说明）' },
]

export const STATUS_CONFIG = {
  pending:   { label: '待审批', className: 'badge-pending' },
  approved:  { label: '已批准', className: 'badge-approved' },
  rejected:  { label: '已拒绝', className: 'badge-rejected' },
  completed: { label: '已完成', className: 'badge-completed' },
}
