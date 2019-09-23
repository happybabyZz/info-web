export const getStatusText = (status: string) =>
  status === 'submitted'
    ? '已提交'
    : status === 'rejected'
    ? '未通过'
    : '已通过';
