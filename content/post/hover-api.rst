---
Categories:
    - Python
Description: Abusing the Hover API for Dynamic DNS
Tags:
    - Development
    - DNS
    - Python
date: 2014-12-09T00:00:00-00:00
menu: main
title: (Ab)using the Hover API
---

(Ab)using the Hover API
=======================

I recently switched from `DirecNIC <https://directnic.com/>`_ to
`Hover <https://www.hover.com/>`_ as my DNS provider for two reasons.
(1) DirectNIC was once a mom-and-pop shop in the late 90's from
New Orleans when I first signed up, which astonishingly
`survived Hurricane Katrina <http://news.netcraft.com/archives/2005/08/31/directnic_stays_online_in_new_orleans_facility.html>`_
. However, it appears they have sold out to some international
conglomerate, moved their support staff overseas, and the same
problems that plagued their control panel in 1997 continue to this
day. (2) Hover is a subsidiary of `Tucows, Inc. <http://en.wikipedia.org/wiki/Tucows>`_
which was originally founded in Flint, MI by Scott Swedorski --
where I also resided for eight years.  Hover's technical and support
staff continue to reside in Toronto, ON.

Recently, I set up a new build service for the
`pexpect <http://pexpect.readthedocs.org/en/latest/>`_ project, which according
to `pypi <https://pypi.python.org/pypi/pexpect/>`_ receives nearly 50,000
downloads each month.  It is imperative to use continuous integration to run a
full suite of tests across as many Operating Systems as possible.  I use
`joyent <http://joyent.com/>`_ as a Sun Solaris hosting provider, but their costs
run a quite a bit higher than services like
`DigitalOcean <https://www.digitalocean.com/>`_.  To save several hundred dollars
a year, I dynamically provision a Solaris host on-demand, triggered by the build
system, which destroys itself after a period of inactivity.

Dynamic DNS
-----------

I decided to have something of a dynamic DNS, so that ``sunos.pexpect.org`` would
always resolve to the latest provisioned host.  I was disappointed to find that
Hover `does not provide a documented API <https://help.hover.com/entries/20860046-Hover-needs-an-API>`_.
I did, however, find that they have one, thanks to
`@dankrause <https://github.com/dankrause>`_'s
`gist <https://gist.github.com/dankrause/5585907>`_.

So I used this to create a simple dynamic dns update script, given the variables:

- ``HOVER_USERNAME``
- ``HOVER_PASSWORD``

And TeamCity variables:

- ``%primaryIp%``
- ``%name%``

Which are replaced when the script is included in-line as part of the Build
Configuration.  I could then use the following script to update sunos.pexpect.org::

        #!/usr/bin/env python2.7
        from __future__ import print_function
        import requests
        import sys
        import os

        class HoverException(Exception):
            pass

        class HoverAPI(object):
            def __init__(self, username, password):
                params = {"username": username, "password": password}
                r = requests.post("https://www.hover.com/api/login", params=params)
                if not r.ok or "hoverauth" not in r.cookies:
                    raise HoverException(r)
                self.cookies = {"hoverauth": r.cookies["hoverauth"]}
            def call(self, method, resource, data=None):
                url = "https://www.hover.com/api/{0}".format(resource)
                r = requests.request(method, url, data=data, cookies=self.cookies)
                if not r.ok:
                    raise HoverException(r)
                if r.content:
                    body = r.json()
                    if "succeeded" not in body or body["succeeded"] is not True:
                        raise HoverException(body)
                    return body

        # connect to API
        client = HoverAPI(os.environ.get('HOVER_USERNAME'),
                          os.environ.get('HOVER_PASSWORD'))
        primaryIp = "%primaryIp%"
        dnsname = "%name%"

        dns_name, domain_name = dnsname.split('.', 1)

        # get all DNS records
        result = client.call("get", "dns")
        assert result['succeeded'], result

        # discover existing dns record, if any
        dns_record = None
        domain_record = None
        for dns_domain in result['domains']:
            if dns_domain['domain_name'] == domain_name:
                domain_record = dns_domain
                for dns_entry in dns_domain['entries']:
                    if dns_entry['name'] == dns_name:
                        dns_record = dns_entry
                        break
            if dns_record is not None and domain_record is not None:
                break

        if dns_record is not None and domain_record is not None:
            print("Deleting entry for {0}.{1} ... "
                  .format(dns_name, domain_name), end="")
            result = client.call("delete", "dns/{0}".format(dns_record['id']))
            assert result['succeeded'], result
            print("OK")
        else:
            print("No record exists for {0}".format(dnsname))

        print("Creating A record {0}.{1} => {2} ... "
              .format(dns_name, domain_name, primaryIp), end="")

        ## create a new A record:
        record = {"name": dns_name, "type": "A", "content": primaryIp}
        post_id = "domains/{0}/dns".format(domain_record['id'])
        result = client.call("post", post_id, record)
        assert result['succeeded'], result
        print("OK")

It works like a charm!

::

        [03:59:05] Deleting entry for sunos.pexpect.org ... OK
        [03:59:05] Creating A record sunos.pexpect.org => 165.225.151.208 ... OK
