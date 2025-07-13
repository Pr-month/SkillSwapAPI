export enum RequestStatus {
  PENDING = 'pending', // Ожидает рассмотрения
  ACCEPTED = 'accepted', // Принято
  REJECTED = 'rejected', // Отклонено
  IN_PROGRESS = 'inProgress', // В процессе выполнения
  DONE = 'done', // Завершено
}

export enum RequestAction {
  READ = 'read',
  ACCEPT = 'accept',
  REJECT = 'reject',
}
