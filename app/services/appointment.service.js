const db = require("../models");
const appointment = db.appointment;

class appointmentService {
    async getAll(params) {
        const { pageIndex, pageSize, sortOrder, sortKey, showDeleted, query, businessId } = params;
        const whereClause = query
        ? {
            [db.Op.or]: [{ title: { [db.Op.like]: `%${query}%` } }, { parent: { [db.Op.like]: `%${query}%` } }],
        }
        : {};
        if (businessId) whereClause.businessId = businessId;
        return await appointment.findAndCountAll({
            where: whereClause,
            paranoid: showDeleted,
            limit: pageSize,
            offset: (pageIndex - 1) * pageSize,
            order: [[sortKey, sortOrder]],
            include: [],
        })
    }
    async getById(id) {
        return await appointment.findByPk(id, { paranoid: false });
    }
    async create(data){
        return await appointment.create(data);
    }
    async update(id, data) {
        return await appointment.update(data,{ where: {id} });
    }
    async delete(id, params) {
        return await appointment.destroy({ where: {id}, force: params?.force == "true" });
    }
    async restore(id) {
        return await appointment.restore({ where: {id} });
    }
}
module.exports = new appointmentService();