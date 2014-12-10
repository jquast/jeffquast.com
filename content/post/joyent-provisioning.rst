---
Categories:
    - Shell
Description: Joyent Provisioning from Custom Image
Tags:
    - Development
    - SunOS
    - Shell
date: 2014-12-09T00:00:00-00:00
menu: main
title: Joyent Provisioning from Custom Image
---


Joyent Provisioning from Custom Image
=====================================

As mentioned in another `blog post </http://jeffquast.com/post/hover-api/>`_
about abusing the Hover API, I am using `joyent.com <https://www.joyent.com>`_
to provision a Solaris build server agent.  I prepared an image with the
service ``teamcity-agent``, which, when enabled, will be ready to build any
project build configurations which require ``SunOs``. As it is quite expensive
to run a Solaris host on Joyent all year-long (several hundreds of dollars),
I thought it worthwhile to spend at least a few hours to provision a compute
instance for testing `pexpect <http://pexpect.readthedocs.org/>`_ builds
on-demand through `TeamCity <https://www.jetbrains.com/teamcity/>`_.

This requires

- Provisioning new compute (may be done through the web interface)
- `Create a custom image from Compute`_.
- `Create a Machine instance from Custom Image`_.

Create a custom image from Compute
------------------------------------

With a Compute Instance tailored to support python builds and contain the
TeamCity agent, I was able to create a TeamCity job to be executed manually
to store a Custom Image for later provisioning, requiring:

- ``%machine-uuid%`` - The UUID of the Computer instance
- ``%name%`` - The friendly-name from the Custom Image to be created
- ``%description%`` - The friendly description of the Image.
- ``%build.counter%`` - The image is versioned using the TeamCity build counter.

::

        #!/bin/bash
        # https://apidocs.joyent.com/cloudapi/#CreateImageFromMachine
        set -e
        set -o pipefail

        [ -z $TEMP ] && TEMP=/tmp

        output=$(mktemp $TEMP/createimagefrommachine.XXXX)
        sdc-createimagefrommachine \
            --machine %machine-uuid% \
            --name %name% \
            --description "%description%" \
            --imageVersion="1.%build.counter%" \
        > "${output}"

        image_id=$(json -a id < "${output}")
        state=$(json -a state < "${output}")
        if [ -z $image_id ]; then
           echo "Unable to determine image uuid."
           echo "Presumably, an error occurred. Please see program output:"
           cat "${output}"
        fi
        rm -f "${output}"

        while [ X"$state" != X"active" ]; do
            echo "Image state is $state"
            if [ X"$state" == X"failed" ]; then
                sdc-getimage $image_id
                exit 1
            fi
            sleep 10
            state=$(sdc-getimage $image_id | json -a state)
        done

        echo "Image state is ${state}"
        echo "Image UUID is ${image_uuid}

Create a Machine instance from Custom Image
-------------------------------------------

With the custom image requirement satisfied, you need only provide

- ``%image-name%`` - the friendly-name used for the base image to provision.
- ``%name%`` - the friendly-name used to provision the instance (``sunos.pexpect.org``)
- ``%package%`` - the compute package name, indicating vCpu, memory, and disk resources.

::

        #!/bin/bash
        # https://apidocs.joyent.com/cloudapi/#CreateMachine
        set -e
        set -o pipefail

        [ -z $TEMP ] && TEMP=/tmp
        output="$(mktemp $TEMP/sdc-createmachine.XXXXXX)"

        # First, discover if a machine by this name
        # is already been provisioned!
        sdc-listmachines | json -c 'this.name=="'%name%'"' > "${output}"
        machine_id=$(json -a id < "${output}")

        if [ ! -z "${machine_id}" ]; then
             echo "A machine by this name has already been provisioned."
        else
            # Given the package name (eg. g3-standard-0.25-smartos),
            # discover the UUID.
            package_uuid=$(sdc-listpackages \
                           | json -a id \
                                  -c 'this.name=="%package%"')
            if [ -z $package_uuid ]; then
                echo "No package found by name %package%"
                echo "Available packages:"
                sdc-listpackages | json -a name
                exit 1
            fi

            # Given the image name (eg. teamcity-agentbase),
            # discover the UUID.
            image_uuid=$(sdc-listimages --public=false \
                         | json -a id \
                                -c 'this.name=="%image-name%"')
            if [ -z $image_uuid ]; then
                echo "No image found by name %image-name%"
                echo "Available image names:"
                sdc-listimages --public=false | json -a name
                exit 1
            fi
            echo "image-id is ${image_uuid}"

            # Next, verify the image uuid is active
            image_status=$(sdc-getimage ${image_uuid} | json -a state)
            if [ X"$image_status" != X"active" ]; then
                echo "Expected image status should be 'active' but state=${image_status}" 2>&1
                echo "Available images:"
                sdc-listimages --public=false
                exit 1
            fi

            # finally, create the machine with the given
            # image uuid and package uuid and optional name.
            sdc-createmachine \
                --image=${image_uuid} \
                --enable-firewall=true \
                --package=${package_uuid} \
                --name="%name%" \
            > "${output}"

            machine_id=$(json < "${output}" -a id)
            if [ -z ${machine_id} ]; then
                echo "Failed to get machine uuid from sdc-createmachine."
                echo "Presumably, an error occurred. See program output:"
                cat "${output}"
                rm -f "${output}"
                exit 1
            fi
        fi

        echo "machine-id: ${machine_id}"
        state=$(json -a state < "${output}")

        while [ X"$state" != X"running" ]; do
            echo "Machine state is $state"
            sleep 10
            sdc-getmachine $machine_id > "${output}"
            state=$(json -a state < "${output}")
        done
        echo "Machine state is ${state}"

        primaryIp=$(json -a primaryIp < "${output}")
        if [ -z ${primaryIp} ]; then
            echo "Failed to get primaryIp from sdc-listmachines."
            echo "Presumably, an error occurred. Please see program output:"
            cat "{$output}"
            rm -f "${output}"
            exit 1
        fi
        rm -f "${output}"

        echo "primaryIp is ${primaryIp}"
        echo "##teamcity[setParameter name='primaryIp' value='"${primaryIp}"']"


Using TeamCity
==============

JetBrains was kind enough to finally respond to my request for an Open Source
Software license, which I certainly plan to take advantage of for all of my
projects over the coming year.  As `pexpect <http://pexpect.readthedocs.org/>`_
is used as part of the `IPython <http://ipython.org/>`_ project, which JetBrains
uses in their Commercially Licensed product
`PyCharm <https://www.jetbrains.com/pycharm/webhelp/ipython.html>`_
it is good to see us mutually benefit by using their `TeamCity
<https://www.jetbrains.com/teamcity/>`_ Continuous Integration service.

I must re-apply each year, so I'm still concerned that I might be locked out of
my own builds if they fail to renew my license, but it more than satisfies my
needs of Parallel Builds, ease of Administration, E-mail notifications, GitHub
push API support, and GitHub commit status notifications.

I will miss using `Travis-CI <https://travis-ci.org/>`_ but their builds have
intermittent errors, do not support Solaris, OSX, FreeBSD, or Windows
environments, and there have been many tests which fail on Travis-CI that
cannot be reproduced.  However, it is still free, and can be set up in less
than an hours' effort.
