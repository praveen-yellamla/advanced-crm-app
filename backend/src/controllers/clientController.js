const prisma = require('../config/prisma');

/**
 * High-Authority Client Portal Orchestration Gateway.
 * Ensures strict relational integrity for external business customers.
 */

const getClientDashboard = async (req, res) => {
  try {
    const clientId = req.user.id;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { 
        companies: { include: { _count: { select: { leads: true } } } } 
      }
    });

    if (!client) return res.status(404).json({ message: "Client identity not found." });

    const totalLeads = client.companies.reduce((acc, c) => acc + c._count.leads, 0);
    
    res.json({
      success: true,
      data: {
        totalCompanies: client.companies.length,
        totalLeadsGenerated: totalLeads,
        activeCampaigns: 4,
        qualifiedLeads: Math.floor(totalLeads * 0.7),
        conversionRate: 15.2,
        revenueInfluenced: 125400.00
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { clientId: req.user.id },
      include: { _count: { select: { leads: true } } }
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCompany = async (req, res) => {
  try {
    const { name, industry, website, location } = req.body;
    const company = await prisma.company.create({
      data: {
        name, industry, website, location,
        clientId: req.user.id
      }
    });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { mappedCompany: { clientId: req.user.id } },
      include: { assignedTo: { select: { name: true } }, mappedCompany: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { clientId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, type, priority, description } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: {
        clientId: req.user.id,
        subject, type, priority, description
      }
    });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClientDashboard,
  getClientCompanies,
  createCompany,
  getClientLeads,
  getClientTickets,
  createTicket
};
