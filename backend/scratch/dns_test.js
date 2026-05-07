const dns = require('dns');
const hosts = ['smtp-relay.brevo.com', 'dpg-d7lj7u9j2pic73f3fprg-a.singapore-postgres.render.com'];

hosts.forEach(host => {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.error(`DNS Error for ${host}:`, err);
    } else {
      console.log(`DNS Success for ${host}: ${address} (v${family})`);
    }
  });
});
