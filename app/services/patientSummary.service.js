const db = require("../models");
const patientsummary = db.patientSummary;

class patientsummaryService {
    async getAll(params) {
        const { pageIndex, pageSize, sortOrder, sortKey, showDeleted, query, businessId } = params;
        const whereClause = query
        ? {
            [db.Op.or]: [{ title: { [db.Op.like]: `%${query}%` } }, { parent: { [db.Op.like]: `%${query}%` } }],
        }
        : {};
        if (businessId) whereClause.businessId = businessId;
        return await patientsummary.findAndCountAll({
            where: whereClause,
            paranoid: showDeleted,
            limit: pageSize,
            offset: (pageIndex - 1) * pageSize,
            order: [[sortKey, sortOrder]],
            include: [],
        })
    }
    async getById(id) {
        return await patientsummary.findByPk(id, { paranoid: false });
    }
    async create(data){
        return await patientsummary.create(data);
    }
    async update(id, data) {
        return await patientsummary.update(data,{ where: {id} });
    }
    async delete(id, params) {
        return await patientsummary.destroy({ where: {id}, force: params?.force == "true" });
    }
    async restore(id) {
        return await patientsummary.restore({ where: {id} });
    }
}
module.exports = new patientsummaryService();